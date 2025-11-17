declare module '@woocommerce/woocommerce-rest-api' {
  interface WooCommerceConfig {
    url: string;
    consumerKey: string;
    consumerSecret: string;
    version: string;
    queryStringAuth?: boolean;
  }

  class WooCommerceRestApi {
    constructor(config: WooCommerceConfig);
    get(endpoint: string, params?: any): Promise<any>;
    post(endpoint: string, data?: any, params?: any): Promise<any>;
    put(endpoint: string, data?: any, params?: any): Promise<any>;
    delete(endpoint: string, params?: any): Promise<any>;
  }

  export default WooCommerceRestApi;
}
