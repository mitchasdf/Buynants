# Buynants
Tools for fast-paced spot trading on Binance.
Was meant for personal use, but I like a public backup since this took a while to get to the state it is in.
Currently only works on Spot, page needs reloading if you want the hotkeys back after clicking a leverage tab.

Requires a user script loader installed on your browser.

DISCLAIMER: The tools provided on this repository are in no way a means of encouraging users to engage in financially risky activities. Users of this software agree that they invest their money at their own discretion. This software and the distributor will not be held accountable for any financial losses incurred as a result of regular software operation OR in the event of software failure.

Note that this script is set to run once every 50 miliseconds, but due to some abhorrent standards that have arose over the past few years (as of mid-2022), browsers will prevent this type of activity and impose a limit of 1,000 miliseconds (20 times slower than my intended running speed). So in order for me to combat this, specifically for google chrome, I need to have binance open in a completely separate instance of chrome and never minimized it and never have any other tabs open in that instance. This patch on behalf of these devs was apparently in order to save battery life on devices. The penalty for "saving battery life" is such that scripts running in what is considered "the background" can not run more than once every 1 second which consequently causes a lot of malfunctions in scripts which run on a continuous loop, such as this script. Keeping a separate chrome instance never minimized is the only way to not have that chrome tab fall under "the background". To read about this elsewhere, search for "chrome timer throttling".

With that nonsensical jank out of the road; The tools provided are as follows:

A basic 10-minute long 1-second chart that can't be magnified or panned. Notches placed horizontally for each minute. Notches placed vertically for each 1% in price difference (this adjusts over time as the price moves). Data is auto-fit to the drawing area. Data accumulates over time, as in, you need to be viewing 1 trading-pair for 10 minutes in order to fill up the chart.

An orderbook and sales history comparison visualisation

Various hotkeys for the spot trading interface:

The scroll wheel can be used to set a price for either the base or quote currencies, while the spacebar can be used to click either the buy or sell button depending on which currency was last scrolled in. Holding in the shift key will multiply the amount to move by x8 for that scroll. Pressing the tilde key will toggle micro-mode. Micro-mode will step by the smallest possible amount when scrolling. Scrolling in either currency box will set the amount box to the maximum it can be set to. There is currently no limiter on this, sorry.

F1 and F2 can be used to set a buy or sell offer at 30% or 70% respectively of the high and low price of the last 3 seconds (for use during massive trade volume and volatility). Shift can also be held to set a panic buy or sell order, as in, 50% of the diff between high/low under low or over high respectively.

Escape can be used to cancel your top-most offer, without even needing to have the open orders interface open.

!!NONE OF THESE HOTKEYS WORK IF YOUR CURRENT FOCUS IS THE TRADING VIEW WINDOW!! - So if you click the main chart at all, you need to click somewhere else that isn't the chart. Inconvenient I know but I am tired of fighting with the code on the page and I don't know how to fix the issue.
