import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function getPreviousWeekdayDate() {
  // Get the most recent market open time/date if none provided
  const currentDate = new Date()
  let previousDate = new Date(currentDate)
  previousDate.setUTCDate(currentDate.getUTCDate() - 1)
  previousDate.setUTCHours(13, 30, 0, 0)

  // Check if the previous date is a weekday (Monday to Friday)
  while (previousDate.getUTCDay() === 0 || previousDate.getUTCDay() === 6) {
    previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  }

  return previousDate
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Check if the pathname matches the dynamic route pattern
  const dynamicRoutePattern = /^\/([^\/]+)$/ // Matches /[symbol] where [symbol] is any non-empty string
  const match = url.pathname.match(dynamicRoutePattern)
  if (
    dynamicRoutePattern.test(url.pathname) &&
    match &&
    !url.searchParams.has("start")
  ) {
    const previousWeekdayDate = getPreviousWeekdayDate()
    const formattedDate = previousWeekdayDate.toISOString()
    url.searchParams.set("start", formattedDate) // Corrected search parameter setting
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
export const config = {
  matcher: "/:path*", // Match all paths
}
