# Buynants
Tools for fast-paced spot trading on Binance.
Was meant for personal use, but I like a public backup since this took a while to get to the state it is in.

Requires a user script loader installed on your browser.

DISCLAIMER: The tools provided on this repository are in no way a means of encouraging users to engage in financially risky activities. Users of this software agree that they invest their money at their own discretion. This software and the distributor will not be held accountable for any financial losses incurred as a result of regular software operation OR in the event of software failure.

The tools were built for a specific mode of view, seen in settings.png

The tools provided are as follows:

A basic 10-minute long 1-second chart that can't be magnified or panned. Notches placed horizontally for each minute. Notches placed vertically for each 1% in price difference (this adjusts over time as the price moves). Data is auto-fit to the drawing area. Data accumulates over time, as in, you need to be viewing 1 trading-pair for 10 minutes in order to fill up the chart.

An orderbook and sales history comparison visualisation

Various hotkeys for the spot trading interface (in the Limit tab only):

The scroll wheel can be used to set a price for either the base or quote currencies, while the spacebar can be used to click either the buy or sell button depending on which currency was last scrolled in. Holding in the shift key will multiply the amount to move by x8 for that scroll. Pressing the tilde key will toggle micro-mode. Micro-mode will step by the smallest possible amount when scrolling. Scrolling in either price box will set the amount box to the maximum it can be set to. There is currently no limiter on this, sorry.

F1 and F2 can be used to set a buy or sell offer at 30% or 70% respectively of the high and low price of the last 3 seconds (for use during massive trade volume and volatility). Shift can also be held to set a panic buy or sell order, as in, 50% of the diff between high/low under low or over high respectively.

Escape can be used to cancel your top-most offer, without even needing to have the open orders interface open.

*If the hotkeys do not work, try clicking the "Limit" button, or pressing F12

!!NONE OF THESE HOTKEYS WORK IF YOUR CURRENT FOCUS IS THE TRADING VIEW WINDOW!! - So if you click the main chart at all, you need to click somewhere else that isn't the chart. Inconvenient I know but I am tired of fighting with the code on the page and I don't know how to fix the issue. The scroll wheel seems to be an exception here and will still edit the text boxes while your focus is the trading view.
