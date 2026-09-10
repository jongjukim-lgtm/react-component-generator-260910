import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  return (
    <LiveProvider code={code} noInline>
      <div className="figure">
        <span className="tick tick--tl" aria-hidden="true" />
        <span className="tick tick--tr" aria-hidden="true" />
        <span className="tick tick--bl" aria-hidden="true" />
        <span className="tick tick--br" aria-hidden="true" />
        <ReactLivePreview />
      </div>
      <LiveError className="preview-error" />
    </LiveProvider>
  );
}
