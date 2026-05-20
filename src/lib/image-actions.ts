export async function downloadImage(imageUrl: string, filename: string) {
  const url = imageUrl.startsWith("http")
    ? imageUrl
    : `${window.location.origin}${imageUrl}`;
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export async function shareImage(imageUrl: string, title: string) {
  const url = imageUrl.startsWith("http")
    ? imageUrl
    : `${window.location.origin}${imageUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "中式梦核记录器",
        text: title,
        url,
      });
      return;
    } catch {
      /* fall through to copy */
    }
  }

  await navigator.clipboard.writeText(url);
  alert("图片链接已复制，可粘贴分享给朋友");
}
