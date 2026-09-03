declare function useAsyncData<DataT>(key: () => string, handler: () => Promise<DataT>): unknown;
