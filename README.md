# Buynants
Tools for fast-paced spot trading on Binance.
Was meant for personal use, but I like a public backup since this took a while to get to the state it is in.
Currently only works on Spot, page needs reloading if you want the hotkeys back after clicking a leverage tab.

DISCLAIMER: The tools provided on this repository are in no way a means of encouraging users to provide in financially risky activities. Users of this software agree that they invest their money at their own discretion. This software and the distributor will not be held accountable for any financial losses incurred as a result of software failure.


The tools provided are as follows:

A basic 10-minute long 1-second chart that can't be magnified

An orderbook and sales history comparison visualisation

Various hotkeys for the spot trading interface:

The scroll wheel can be used to set a price for either the base or quote currencies, while the spacebar can be used to click either the buy or sell button depending on which currency was last scrolled in. Holding in the shift key will multiply the amount to move by x8 for that scroll. Pressing the tilde key will toggle micro-mode. Micro-mode will step by the smallest possible amount when scrolling. Scrolling in either currency box will set the amount box to the maximum it can be set to. There is currently no limiter on this, sorry.

F1 and F2 can be used to set a buy or sell offer at 30% or 70% respectively of the high and low price of the last 3 seconds (for use during massive trade volume and volatility). Shift can also be held to set a panic buy or sell order.

Escape can be used to cancel your top-most offer, without even needing to have the open orders interface open.

!!NONE OF THESE HOTKEYS WORK IF YOU CURRENT FOCUS IS THE TRADING VIEW WINDOW!! - So if you click the chart at all, you need to click somewhere else that isn't the chart. Inconvenient I know but I am tired of fighting with the code on the page.
