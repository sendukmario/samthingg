/**
 * Utility functions for Ignite search functionality
 */

/**
 * Opens the Ignite search with optional pre-filled text
 * @param searchText - The text to pre-fill in the search input
 * @param triggerSearch - Whether to immediately trigger the search
 */
export const openIgniteSearch = (
  searchText: string = "",
  triggerSearch: boolean = true,
) => {
  const event = new CustomEvent("openIgniteSearch", {
    detail: { searchText, triggerSearch },
  });
  document.dispatchEvent(event);
};

/**
 * Searches for tokens containing the given text
 * This is a helper that opens the search and immediately searches
 * @param searchText - The text to search for
 */
export const searchIgniteTokens = (searchText: string) => {
  openIgniteSearch(searchText, true);
};
