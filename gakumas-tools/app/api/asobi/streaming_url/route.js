let streamingUrl = null;
let lastUpdated = 0;

export async function GET(request) {
  if (streamingUrl && Date.now() - lastUpdated < 3 * 60 * 1000) {
    // Return cached URL if it was fetched less than 3 minutes ago
    console.log("Returning cached streaming URL");
    return new Response(streamingUrl, { status: 200 });
  }

  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return new Response("Missing videoId parameter", { status: 400 });
  }

  // Fetch token
  const timestamp = Date.now();
  const response = await fetch(
    `https://asobichannel-api.asobistore.jp/api/v1/vspf/token?t=${timestamp}`
  );
  if (!response.ok) {
    return new Response("Failed to fetch token", { status: 500 });
  }
  const token = await response.json();

  // Fetch content URL
  const contentUrl = `https://survapi.channel.or.jp/proxy/v1/contents/${videoId}/get_by_cuid?t=${timestamp}`;
  const contentResponse = await fetch(contentUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!contentResponse.ok) {
    return new Response("Failed to fetch video", { status: 500 });
  }
  const content = await contentResponse.json();

  streamingUrl = content.ex_content.streaming_url;
  lastUpdated = timestamp;

  return new Response(streamingUrl, { status: 200 });
}
