import { useState, useEffect } from "react";
import { FixedSizeList as WindowedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Button as MuiButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { styles } from "@coral-xyz/themes";
import {
  Blockchain,
  toTitleCase,
  walletAddressDisplay,
} from "@coral-xyz/common";
import {
  TextField,
  BalancesTable,
  BalancesTableHead,
  BalancesTableContent,
  BalancesTableRow,
  BalancesTableCell,
} from "@coral-xyz/react-xnft-renderer";
import {
  useActiveWallets,
  useBlockchainLogo,
  useBlockchainTokensSorted,
  useSolanaConnectionUrl,
} from "@coral-xyz/recoil";
import { WithCopyTooltip } from "./WithCopyTooltip";

export type Token = ReturnType<typeof useBlockchainTokensSorted>[number];

const useStyles = styles((theme) => ({
  searchField: {
    marginLeft: "12px",
    marginRight: "12px",
    marginTop: "16px",
    marginBottom: "16px",
    width: "inherit",
    display: "flex",
    "& .MuiOutlinedInput-root": {
      height: "48px !important",
      "& fieldset": {
        border: `solid 1pt ${theme.custom.colors.borderColor}`,
      },
      "&:hover fieldset": {
        border: `solid 2pt ${theme.custom.colors.primaryButton}`,
      },
    },
  },
  addressButton: {
    padding: 0,
    color: theme.custom.colors.secondary,
    textTransform: "none",
    fontWeight: 500,
    lineHeight: "24px",
    fontSize: "14px",
    marginLeft: "8px",
    "&:hover": {
      backgroundColor: "transparent",
      "& svg": {
        visibility: "visible",
      },
    },
  },
  copyIcon: {
    visibility: "hidden",
    width: "16px",
    marginLeft: "6px",
  },
}));

export function SearchableTokenTables({
  onClickRow,
  customFilter = () => true,
}: {
  onClickRow: (blockchain: Blockchain, token: Token) => void;
  customFilter: (token: Token) => boolean;
}) {
  const classes = useStyles();
  const [searchFilter, setSearchFilter] = useState("");
  return (
    <>
      <TextField
        placeholder={"Search"}
        value={searchFilter}
        setValue={setSearchFilter}
        rootClass={classes.searchField}
        inputProps={{
          style: {
            height: "48px",
          },
        }}
      />
      <TokenTables
        searchFilter={searchFilter}
        onClickRow={onClickRow}
        customFilter={customFilter}
      />
    </>
  );
}

export function SearchableTokenTable({
  blockchain,
  onClickRow,
  tokenAccounts,
  customFilter = () => true,
}: {
  blockchain: Blockchain;
  onClickRow: (blockchain: Blockchain, token: Token) => void;
  tokenAccounts?: ReturnType<typeof useBlockchainTokensSorted>;
  customFilter: (token: Token) => boolean;
}) {
  const classes = useStyles();
  const [searchFilter, setSearchFilter] = useState("");
  return (
    <>
      <TextField
        placeholder={"Search"}
        value={searchFilter}
        setValue={setSearchFilter}
        rootClass={classes.searchField}
        inputProps={{
          style: {
            height: "48px",
          },
        }}
      />
      <TokenTable
        blockchain={blockchain}
        onClickRow={onClickRow}
        tokenAccounts={tokenAccounts}
        searchFilter={searchFilter}
        customFilter={customFilter}
      />
    </>
  );
}

export function TokenTables({
  blockchains,
  onClickRow,
  searchFilter = "",
  customFilter = () => true,
}: {
  blockchains?: Array<Blockchain>;
  onClickRow: (blockchain: Blockchain, token: Token) => void;
  searchFilter?: string;
  customFilter?: (token: Token) => boolean;
}) {
  const activeWallets = useActiveWallets();
  const availableBlockchains = [
    ...new Set(activeWallets.map((a: any) => a.blockchain)),
  ];
  const filteredBlockchains =
    blockchains?.filter((b) => availableBlockchains.includes(b)) ||
    availableBlockchains;

  return (
    <>
      {filteredBlockchains.map((blockchain) => (
        <TokenTable
          key={blockchain}
          blockchain={blockchain}
          onClickRow={onClickRow}
          searchFilter={searchFilter}
          customFilter={customFilter}
        />
      ))}
    </>
  );
}

export function TokenTable({
  blockchain,
  onClickRow,
  tokenAccounts,
  searchFilter = "",
  customFilter = () => true,
}: {
  blockchain: Blockchain;
  onClickRow: (blockchain: Blockchain, token: Token) => void;
  tokenAccounts?: ReturnType<typeof useBlockchainTokensSorted>;
  searchFilter?: string;
  customFilter?: (token: Token) => boolean;
}) {
  const classes = useStyles();
  const connectionUrl = useSolanaConnectionUrl();
  const title = toTitleCase(blockchain);
  const blockchainLogo = useBlockchainLogo(blockchain);
  const tokenAccountsSorted = tokenAccounts
    ? tokenAccounts
    : useBlockchainTokensSorted(blockchain);
  const [search, setSearch] = useState(searchFilter);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const activeWallets = useActiveWallets();
  const wallet = activeWallets.filter((w) => w.blockchain === blockchain)[0];

  const searchLower = search.toLowerCase();
  // TODO: support more than 100 tokens.
  const tokenAccountsFiltered =
    blockchain === "solana" && connectionUrl === "https://api.devnet.solana.com"
      ? tokenAccountsSorted.slice(0, 100)
      : tokenAccountsSorted
          .filter(
            (t) =>
              t.name &&
              (t.name.toLowerCase().startsWith(searchLower) ||
                t.ticker.toLowerCase().startsWith(searchLower))
          )
          .filter(customFilter);

  useEffect(() => {
    setSearch(searchFilter);
  }, [searchFilter]);

  const onCopy = () => {
    setTooltipOpen(true);
    setTimeout(() => setTooltipOpen(false), 1000);
    navigator.clipboard.writeText(wallet.publicKey.toString());
  };

  const useVirtualization = tokenAccountsFiltered.length > 100;
  // Note: if this fixed height changes in react-xnft-renderer it'll need to be changed here
  const rowHeight = 68;

  return (
    <BalancesTable
      style={useVirtualization ? { height: "calc(100% - 92px)" } : {}}
    >
      <BalancesTableHead
        props={{
          title,
          iconUrl: blockchainLogo,
          disableToggle: false,
          subtitle: (
            <WithCopyTooltip tooltipOpen={tooltipOpen}>
              <MuiButton
                disableRipple
                className={classes.addressButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                {walletAddressDisplay(wallet?.publicKey)}
                <ContentCopyIcon className={classes.copyIcon} />
              </MuiButton>
            </WithCopyTooltip>
          ),
        }}
      />
      <BalancesTableContent style={useVirtualization ? { height: "100%" } : {}}>
        {useVirtualization ? (
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => {
              return (
                <WindowedList
                  height={height}
                  width={width}
                  itemCount={tokenAccountsFiltered.length}
                  itemSize={rowHeight}
                  itemData={{
                    tokenList: tokenAccountsFiltered,
                    blockchain,
                    onClickRow: (token: Token) => onClickRow(blockchain, token),
                  }}
                  overscanCount={24}
                >
                  {WindowedTokenRowRenderer}
                </WindowedList>
              );
            }}
          </AutoSizer>
        ) : (
          <>
            {tokenAccountsFiltered.map((token: any) => (
              <TokenRow
                key={token.address}
                token={token}
                onClick={(token) => onClickRow(blockchain, token)}
              />
            ))}
          </>
        )}
      </BalancesTableContent>
    </BalancesTable>
  );
}

const WindowedTokenRowRenderer = ({
  index,
  data,
  style,
}: {
  index: number;
  data: any;
  style: any;
}) => {
  const token = data.tokenList[index];
  return (
    <TokenRow
      key={token.mint}
      token={token}
      onClick={() => data.onClickRow(token)}
      style={style}
    />
  );
};

function TokenRow({
  onClick,
  token,
  style,
}: {
  onClick: (token: Token) => void;
  token: Token;
  style?: any;
}) {
  let subtitle = token.ticker;
  if (token.displayBalance) {
    subtitle = `${token.displayBalance.toLocaleString()} ${subtitle}`;
  }
  return (
    <BalancesTableRow onClick={() => onClick(token)} style={style}>
      <BalancesTableCell
        props={{
          icon: token.logo,
          title: token.name,
          subtitle,
          usdValue: token.usdBalance,
          percentChange: token.recentUsdBalanceChange,
        }}
      />
    </BalancesTableRow>
  );
}
