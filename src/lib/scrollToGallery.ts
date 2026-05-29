/** Scroll to the home page exhibit grid (`#gallery`). */
export function scrollToGallery(behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById("gallery");
  if (!el) return false;
  el.scrollIntoView({ behavior });
  return true;
}
