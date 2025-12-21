"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import  {Button}  from "./button"

type CarouselApi = {
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

type CarouselProps = {
  opts?: {
    align?: "start" | "center" | "end"
    loop?: boolean
  }
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: React.RefObject<HTMLDivElement | null>
  api: CarouselApi | undefined
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  orientation: "horizontal" | "vertical"
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = "horizontal", opts, setApi, className, children, ...props }, ref) => {
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const carouselRef = React.useRef<HTMLDivElement>(null)

    const scrollPrev = React.useCallback(() => {
      if (!carouselRef.current) return
      const scrollContainer = carouselRef.current.querySelector("[data-carousel-content]") as HTMLDivElement
      if (!scrollContainer) return

      const scrollAmount = scrollContainer.clientWidth
      scrollContainer.scrollBy({
        left: orientation === "horizontal" ? -scrollAmount : 0,
        top: orientation === "vertical" ? -scrollAmount : 0,
        behavior: "smooth",
      })
    }, [orientation])

    const scrollNext = React.useCallback(() => {
      if (!carouselRef.current) return
      const scrollContainer = carouselRef.current.querySelector("[data-carousel-content]") as HTMLDivElement
      if (!scrollContainer) return

      const scrollAmount = scrollContainer.clientWidth
      scrollContainer.scrollBy({
        left: orientation === "horizontal" ? scrollAmount : 0,
        top: orientation === "vertical" ? scrollAmount : 0,
        behavior: "smooth",
      })
    }, [orientation])

    const handleScroll = React.useCallback(() => {
      if (!carouselRef.current) return
      const scrollContainer = carouselRef.current.querySelector("[data-carousel-content]") as HTMLDivElement
      if (!scrollContainer) return

      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = scrollContainer

      if (orientation === "horizontal") {
        setCanScrollPrev(scrollLeft > 0)
        setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1)
      } else {
        setCanScrollPrev(scrollTop > 0)
        setCanScrollNext(scrollTop < scrollHeight - clientHeight - 1)
      }
    }, [orientation])

    const api = React.useMemo(
      () => ({
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }),
      [scrollPrev, scrollNext, canScrollPrev, canScrollNext],
    )

    React.useEffect(() => {
      if (!carouselRef.current) return
      const scrollContainer = carouselRef.current.querySelector("[data-carousel-content]") as HTMLDivElement
      if (!scrollContainer) return

      handleScroll()
      scrollContainer.addEventListener("scroll", handleScroll)
      window.addEventListener("resize", handleScroll)

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
        window.removeEventListener("resize", handleScroll)
      }
    }, [handleScroll])

    React.useEffect(() => {
      if (setApi) {
        setApi(api)
      }
    }, [api, setApi])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={carouselRef}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  },
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel()

    return (
      <div
        ref={ref}
        data-carousel-content
        className={cn(
          "flex overflow-x-auto scrollbar-hide",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className,
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        {...props}
      />
    )
  },
)
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel()

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)}
        {...props}
      />
    )
  },
)
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel()

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    )
  },
)
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel()

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    )
  },
)
CarouselNext.displayName = "CarouselNext"

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
