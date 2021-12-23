import {
  AccountStore,
  AccountWithCosmos,
  ChainStore,
  getKeplrFromWindow,
  QueriesStore,
  QueriesWithCosmos,
} from "@keplr-wallet/stores";
import { EmbedChainInfos } from "../config";
import { IndexedDBKVStore } from "@keplr-wallet/common";
import EventEmitter from "eventemitter3";

export class RootStore {
  public readonly chainStore: ChainStore;

  public readonly queriesStore: QueriesStore<QueriesWithCosmos>;
  public readonly accountStore: AccountStore<AccountWithCosmos>;

  constructor() {
    this.chainStore = new ChainStore(EmbedChainInfos);

    const eventListener = (() => {
      // On client-side (web browser), use the global window object.
      if (typeof window !== "undefined") {
        return window;
      }

      // On server-side (nodejs), there is no global window object.
      // Alternatively, use the event emitter library.
      const emitter = new EventEmitter();
      return {
        addEventListener: (type: string, fn: () => unknown) => {
          emitter.addListener(type, fn);
        },
        removeEventListener: (type: string, fn: () => unknown) => {
          emitter.removeListener(type, fn);
        },
      };
    })();

    this.queriesStore = new QueriesStore<QueriesWithCosmos>(
      new IndexedDBKVStore("store_web_queries"),
      this.chainStore,
      getKeplrFromWindow,
      QueriesWithCosmos
    );
    this.accountStore = new AccountStore<AccountWithCosmos>(
      eventListener,
      AccountWithCosmos,
      this.chainStore,
      this.queriesStore,
      {
        defaultOpts: {
          prefetching: false,
          suggestChain: false,
          autoInit: false,
          getKeplr: getKeplrFromWindow,
        },
      }
    );
  }
}
