declare module 'mermaid' {
  const mermaid: {
    initialize: (cfg: any) => void
    parse?: (code: string) => Promise<any> | any
    render?: (id: string, code: string, el?: Element | null) => Promise<{ svg: string; bindFunctions?: (el: Element) => void }>
  }
  export default mermaid
}
