/** Shared responsive layout classes for page shells and panels. */

export const pagePaddingClass = "p-4 sm:p-6 lg:p-8"

export const panelPaddingClass = "p-4 sm:p-6"

export const pageGapClass = "gap-6 lg:gap-8"

export const mobileHeaderClass =
  "sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b-2 border-[#1a2540] bg-[#060a14]/95 px-4 pt-[env(safe-area-inset-top)] shadow-[0_4px_0_0_#010204] backdrop-blur-sm md:hidden"

export const mobileStickyFooterClass =
  "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t-2 border-[#1a2540] bg-[#060a14]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_0_0_#010204] backdrop-blur-sm md:hidden"

/** Reserve space above a mobile sticky footer */
export const mobileStickyFooterSpacerClass = "h-28 md:h-0"

export const mobileCtaClass = "w-full sm:w-auto"
