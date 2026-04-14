type SSEOptions = {
  url: string;
  onMessage: (data: any) => void;
  onError?: (err: any) => void;
};

export function createSSE({ url, onMessage, onError }: SSEOptions) {
  let source: EventSource | null = null;
  let retry = 1000;
  function connect() {
    source = new EventSource(url, { withCredentials: true });
    source.onmessage = (event) => {
      retry = 1000;
      onMessage(JSON.parse(event.data));
    };
    source.onerror = (err) => {
      source?.close();

      onError?.(err);

      const delay = retry + Math.random() * 1000;
      setTimeout(connect, delay);
      retry = Math.min(retry * 2, 30000);
    };
  }

  connect();
  return {
    close() {
      source?.close();
    },
  };
}
