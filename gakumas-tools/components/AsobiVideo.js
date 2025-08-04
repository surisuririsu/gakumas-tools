import { memo, useEffect, useState } from "react";
import VideoJS from "./VideoJS";

const AsobiVideo = ({ videoId }) => {
  const [streamingUrl, setStreamingUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/asobi/streaming_url?videoId=" + videoId)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch streaming URL");
        }
        return res.text();
      })
      .then((url) => {
        setStreamingUrl(url);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [videoId]);

  if (!streamingUrl) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <VideoJS
      options={{
        autoplay: true,
        controls: true,
        responsive: true,
        sources: [
          {
            src: streamingUrl,
          },
        ],
      }}
    />
  );
};

export default memo(AsobiVideo, (prevProps, nextProps) => {
  return prevProps.videoId === nextProps.videoId;
});
