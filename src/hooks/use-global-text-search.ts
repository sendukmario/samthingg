"use client";

import { useCallback, useEffect } from "react";
import { useNewlyCreatedFilterStore } from "@/stores/cosmo/use-newly-created-filter.store";

/**
 * Hook for handling global text search, especially for double-click on selectable elements
 */

export default function useGlobalTextSearch() {
  const setPreviewSearch = useNewlyCreatedFilterStore(
    (s) => s.setPreviewSearch,
  );
  const applyFilter = useNewlyCreatedFilterStore(
    (s) => s.applyNewlyCreatedFilters,
  );

  // Keep track of the currently underlined element
  const handleDoubleClickSearch = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;

      // Check if the clicked element is selectable
      const isSelectableElement = target.classList.contains("!select-text");
      const closestSelectableElement = isSelectableElement
        ? target
        : target.closest('[class*="\\!select-text"]');

      // First, remove underline from any previously underlined elements
      document
        .querySelectorAll('[class*="\\!select-text"].underline')
        .forEach((el) => {
          el.classList.remove("underline");
        });

      // Check if the clicked element has the !select-text class or is within such an element
      if (closestSelectableElement) {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText) {
          // Set search term and apply filter
          setPreviewSearch(selectedText);
          applyFilter();

          // Add underline class to the element with !select-text
          if (closestSelectableElement) {
            closestSelectableElement.classList.add("underline");
          }

          // Create and dispatch a custom event to open search form
          const searchEvent = new CustomEvent("openCosmoSearch", {
            detail: { searchText: selectedText, triggerSearch: true },
          });
          document.dispatchEvent(searchEvent);
        }
      }
    },
    [setPreviewSearch, applyFilter],
  );

  // Handle single clicks to remove underline when clicking elsewhere
  const handleSingleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isSelectableElement = target.classList.contains("!select-text");
    const closestSelectableElement = target.closest(
      '[class*="\\!select-text"]',
    );

    // If clicking outside of any !select-text element, remove all underlines
    if (!isSelectableElement && !closestSelectableElement) {
      document
        .querySelectorAll('[class*="\\!select-text"].underline')
        .forEach((el) => {
          el.classList.remove("underline");
        });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("dblclick", handleDoubleClickSearch);
    document.addEventListener("click", handleSingleClick);

    return () => {
      document.removeEventListener("dblclick", handleDoubleClickSearch);
      document.removeEventListener("click", handleSingleClick);
    };
  }, [handleDoubleClickSearch, handleSingleClick]);
}
