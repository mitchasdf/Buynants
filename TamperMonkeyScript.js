// ==UserScript==
// @name         Buynants
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Tools for fast-paced, volatile spot trading on binance. Currently breaks if clicking on leverage tabs, sorry.
// @author       You
// @match        https://www.binance.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=binance.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function RGBMix(arr1, arr2) {
        let result = [];
        for (let i = 0; i < arr1.length; i++) {
            let high = Math.max(arr1[i], arr2[i]);
            let low = Math.min(arr1[i], arr2[i]);
            let diff = high - low;
            result[i] = Math.floor(high - (diff / 2));
        }
        return result;
    }
    let milisecondsBetweenUpdates = 1000; // set to something small such as "50" for extreme volatility trading, else 1000 so as to fit with the timer throttle
    let fullDepthByDefault = false; // enable to check the checkbox by default when loading a page
    let margin = 0.004; // scale amount to offset the opposing currency price box by when scrolling in either
    let steppingScale = 0.001; // scale amount to step by when scrolling in a price box. 0.001 = 0.1%
    let steppingScaleToggleKey = "`"; // use this key to toggle between stepping by scale using the previous setting, or stepping by smallest possible step
    let cancelOffersKey = "Escape"; // cancels the topmost offer
    let buySellKey = " "; // this key clicks the buy or sell button depending on which price box you last scrolled in
    let instantBuyKey = "F1"; // this makes a buy offer instantly that is 28.5% between the lowest and highest traded price in the last 3 seconds
    let instantSellKey = "F2"; // this makes a sell offer instantly that is 72.5% between the lowest and highest traded price in the last 3 seconds
    let resetKeybindsKey = "F12"; // applies the rest of the keybinds to the text boxes if they are missing them (with a delay of 1 second)
    let colourBackground = [22, 26, 30, 1]; // the colour of the element behind canvas
    let colourBad = [223, 50, 50, 1]; // the colour of sell power
    let colourGood = [0, 223, 25, 1]; // the colour of buy power
    let colourStagnant = [255, 127, 35, 0.7]; // colour of price not moving
    let colourTimeNotch = [70, 70, 70, 1]; // colour of minute-markers
    let colourOnePercentNotch = [45, 45, 45, 1]; // colour of percent markers
    let msInOneSec = 5000; // change how many miliseconds each "1-second candlestick" accounts for. i.e. set to 2000 for a 20-minute chart and each candlestick being 2 seconds long.

    let colourBadMid = RGBMix(colourBad, colourBackground);
    let colourGoodMid = RGBMix(colourGood, colourBackground);
    let framesPerSecond = 1000 / milisecondsBetweenUpdates;
    let currentlySteppingByScale = true;
    let initialised = false;
    let sell_price_box = null;
    let buy_price_box = null;
    let sell_amount_box = null;
    let buy_amount_box = null;
    let my_space = null;
    let my_other_space = null;
    let my_toggle_button = null;
    let latestSellLow = 0;
    let latestSellHigh = 0;
    let latestBuyLow = 0;
    let latestBuyHigh = 0;
    let latestHigh = 0;
    let latestLow = 0;
    let marketBuy = 0;
    let marketSell = 0;
    let maxEles = framesPerSecond * 3;
    let highs = [];
    let lows = [];

    let oneSecChart = [];
    let oneSecChartWidth = 601;
    let oneSecChartHeight = 64;
    let currentSecHigh = 0;
    let currentSecLow = 0;
    let currentSecOpen = 0;
    let currentSecClose = 0;
    let msInSecondCycle = 0;
    let oneSecChartLength = 601;

    let msSinceOrderBookUpdate = 0;
    let msBetweenOrderBookUpdates = 200;
    let coinCurrentlyViewing = "";

    let buyButtonSelector = "#orderformBuyBtn";
    let sellButtonSelector = "#orderformSellBtn";
    let buyOrSellButton = buyButtonSelector;
    let sellFundsSelector = "div.proInnerFormWrap > div:nth-child(2) > div > div > div:nth-child(2) > span";
    let buyFundsSelector = "div.proInnerFormWrap > div:nth-child(1) > div > div > div:nth-child(2) > span";
    let limitOfferButtonSelector = "div.headingWrap > div > span[data-testid=\"LimitType\"]";
    let offerCancelButtonSelector = "#cancel-order > div > div > svg.normal";
    let lastSaleSelector = "div.list-container > div.list-auto-sizer > div.fixed-size-list > div > div:nth-child(1) > div > div.price.left";
    let lastSaleTimeSelector = "div.list-container > div.list-auto-sizer > div.fixed-size-list > div > div:nth-child(1) > div > div.text:nth-child(2)";
    let moreButtonSelector = "#spotOrderbook > div.orderlist-container > div.orderbook-ticker > div > a.more";
    let marketSellPriceSelector = "#spotOrderbook > div.orderlist-container > div.orderbook-list.orderbook-ask.has-overlay > div:nth-child(1) > div.orderbook-list-container > div > div:last-child > div > div.row-content > div.ask-light";
    let marketBuyPriceSelector = "#spotOrderbook > div.orderlist-container > div.orderbook-list.orderbook-bid.has-overlay > div:nth-child(1) > div.orderbook-list-container > div > div:nth-child(1) > div > div.row-content > div.bid-light";
    let orderBookSellersSelectorAll = "#spotOrderbook > div.orderlist-container > div.orderbook-list.orderbook-ask.has-overlay > div:nth-child(1) > div.orderbook-list-container > div > div > div > div.row-content";
    let orderBookBuyersSelectorAll = "#spotOrderbook > div.orderlist-container > div.orderbook-list.orderbook-bid.has-overlay > div:nth-child(1) > div.orderbook-list-container > div > div > div > div.row-content";
    let emptySpaceSelector = "#__APP > div > div > div[name=\"chart\"] > div > div > div > div.focus-area > div:nth-child(2)";
    let tradeListItemSoldSelectorAll = "div.list-container > div.list-auto-sizer > div.fixed-size-list > div > div.list-item-container > div.list-item-entity.trade-list-item.trade-list-item-sell";
    let tradeListItemBoughtSelectorAll = "div.list-container > div.list-auto-sizer > div.fixed-size-list > div > div.list-item-container > div.list-item-entity.trade-list-item.trade-list-item-buy";
    let defaultOrderBookSelector = "#spotOrderbook > div.orderbook-header > button[data-testid=\"defaultModeButton\"]";
    let buyOrderBookSelector = "#spotOrderbook > div.orderbook-header > button[data-testid=\"buyModeButton\"]";
    let sellOrderBookSelector = "#spotOrderbook > div.orderbook-header > button[data-testid=\"sellModeButton\"]";
    let myToggleButtonSelector = emptySpaceSelector + " > input[type=\"checkbox\"]";
    let myOtherEmptySpaceSelector = "#__APP > div > div > div[name=\"header\"] > div > header";
    let notificationSelector = "#__APP > div > div > div > div[class=\"bn-notification-body-wrapper\"] > div[class=\"bn-notification-msg-wrapper\"]";
    let orderTypeTabSelectorSpot = "#__APP > div > div > div.orderform > div > div > div.tradeSwitchWrap > div.tradeItemSwitchWrap[data-testid=\"spotTab\"]";
    let orderTypeTabSelectorCross = "#__APP > div > div > div.orderform > div > div > div.tradeSwitchWrap > div.tradeItemSwitchWrap[data-testid=\"crossTab\"]";
    let orderTypeTabSelectorIsolated = "#__APP > div > div > div.orderform > div > div > div.tradeSwitchWrap > div.tradeItemSwitchWrap[data-testid=\"IsolatedTab\"]";


    let ensureDoWheelBinds = true;
    let frameWaitCap = Math.floor(1000 / milisecondsBetweenUpdates);
    let frameWaitWheel = frameWaitCap;
    let frameWaitLimit = frameWaitCap;
    let ensureDoLimitOnclicks = true;
    let frameWaitTab = 0;

    function GetAvailable(selector) {
        let avail = document.querySelector(selector).innerText.replaceAll(',','');
        if (avail.includes(" ")) {
            avail = avail.substring(0, avail.indexOf(" "));
        }
        avail = Number(avail);
        return avail;
    }
    function StepFloor(amount, step) {
        return Math.floor(amount / step) * step;
    }
    function StepRound(amount, step) {
        return Math.round(amount / step) * step;
    }
    function StepCeil(amount, step) {
        return Math.ceil(amount / step) * step;
    }
    function UnFocus(element) {
        if (document.activeElement == element) {
            element.blur();
        }
        if (document.activeElement != element.parentElement) {
            element.parentElement.focus();
        }
    }
    function FloatRound(val, digits, substituteMissingSign=true) {
        let result = val.toLocaleString('en-EN',{minimumFractionDigits:digits, maximumFractionDigits:digits}).replaceAll(',','');
        if (!substituteMissingSign || (val < 0)) return result;
        return ' ' + result;
    }
    function GenericWheelBindBegin(box, event, stepByScale) {
        UnFocus(box);
        //if (document.activeElement == box) box.blur();
        let stepAttr = box.getAttribute("step");
        let step = Number(stepAttr);
        let mul = 0;
        if (event.deltaY > 0) mul = -1;
        else if (event.deltaY < 0) mul = 1;
        if (event.shiftKey) mul *= 8;
        let innerVal = box.getAttribute("value");
        if (innerVal == null || innerVal == "") innerVal = 0;
        else innerVal = Number(innerVal);
        let newVal;
        if (stepByScale) {
            if (mul > 0) newVal = StepCeil(innerVal * (1 + (steppingScale * mul)), step);
            else if (mul < 0) newVal = StepFloor(innerVal * (1 + (steppingScale * mul)), step);
            else newVal = innerVal;
        }
        else newVal = StepRound(Math.max(innerVal + (step * mul), 0), step);
        return [newVal, step];
    }
    function GenericWheelBindEnd(box, value, step) {
        UnFocus(box);
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        step = step.toString();
        if (step.includes(".")) value = FloatRound(value, step.length - 2, false);
        else value = value.toString();
        nativeInputValueSetter.call(box, value);
        let inputEvent = new Event('input', { bubbles: true });
        box.dispatchEvent(inputEvent);
        let changeEvent = new Event('change', { bubbles: true });
        box.dispatchEvent(changeEvent);
    }
    function GenericWheelBindPriceBox(priceBox, amtBox, selector, priceVal) {
        let targStep = Number(amtBox.getAttribute("step"));
        let targetAmt = GetAvailable(selector);
        if (amtBox == buy_amount_box) targetAmt /= priceVal;
        targetAmt = StepFloor(targetAmt, targStep);
        GenericWheelBindEnd(amtBox,targetAmt, targStep);
    }
    function WheelBindSellPrice(event) {
        buyOrSellButton = sellButtonSelector;
        let results = GenericWheelBindBegin(sell_price_box, event, currentlySteppingByScale);
        let value = results[0], step = results[1];
        GenericWheelBindEnd(sell_price_box, value, step);
        GenericWheelBindPriceBox(sell_price_box, sell_amount_box, sellFundsSelector, value);
        GenericWheelBindEnd(buy_amount_box, 0, step);
        GenericWheelBindEnd(buy_price_box, StepCeil(value * (1 - margin), step), step);
        return false;
    }
    function WheelBindBuyPrice(event) {
        buyOrSellButton = buyButtonSelector;
        let results = GenericWheelBindBegin(buy_price_box, event, currentlySteppingByScale);
        let value = results[0], step = results[1];
        GenericWheelBindEnd(buy_price_box, value, step);
        GenericWheelBindPriceBox(buy_price_box, buy_amount_box, buyFundsSelector, value);
        GenericWheelBindEnd(sell_amount_box, 0, step);
        GenericWheelBindEnd(sell_price_box, StepFloor(value * (1 + margin), step), step);
        return false;
    }
    function WheelBindSellAmount(event) {
        buyOrSellButton = sellButtonSelector;
        let results = GenericWheelBindBegin(sell_amount_box, event, false);
        let value = results[0], step = results[1];
        let coinsAvailable = StepFloor(GetAvailable(sellFundsSelector), step);
        GenericWheelBindEnd(sell_amount_box, Math.min(coinsAvailable, value), step);
        return false;
    }
    function WheelBindBuyAmount(event) {
        buyOrSellButton = buyButtonSelector;
        let results = GenericWheelBindBegin(buy_amount_box, event, false);
        let value = results[0], step = results[1];
        let fiatAvailable = GetAvailable(buyFundsSelector);
        let buyPrice = Number(buy_price_box.getAttribute("value"));
        let maximum = StepFloor(fiatAvailable / buyPrice, step);
        GenericWheelBindEnd(buy_amount_box, Math.min(maximum, value), step);
        return false;
    }
    function NumberOfPrettifiedText(selector) {
        return Number(document.querySelector(selector).innerText.replaceAll(',',''));
    }

    function GenericKeyDown(event) {
        let prevent = false;
        if (event.key == steppingScaleToggleKey) {
            if (!event.repeat) currentlySteppingByScale = !currentlySteppingByScale;
            prevent = true;
        }
        let button = null;
        if (event.key == buySellKey || event.key == instantBuyKey || event.key == instantSellKey) {
            let thisBuyOrSellButton = buyOrSellButton;
            if (event.key != buySellKey) {
                //MainLoop(false);
                let amountBox = buy_amount_box;
                let priceBox = buy_price_box;
                let fundsSelector = buyFundsSelector;
                let shiftScale = 0.285;
                let latestDif = (latestHigh - latestLow) * shiftScale;
                if (event.ctrlKey || event.shiftKey) latestDif *= 1.5 / shiftScale;
                let latestPrice = latestLow + latestDif;
                thisBuyOrSellButton = buyButtonSelector;
                if (event.key == instantSellKey) {
                    amountBox = sell_amount_box;
                    priceBox = sell_price_box;
                    fundsSelector = sellFundsSelector;
                    thisBuyOrSellButton = sellButtonSelector;
                    latestPrice = latestHigh - latestDif;
                }
                let amountStep = Number(amountBox.getAttribute("step"));
                let priceStep = Number(priceBox.getAttribute("step"));
                let priceValue = StepFloor(latestPrice, priceStep);
                let funds = GetAvailable(fundsSelector);
                let amountValue = StepFloor(funds / ((event.key == instantBuyKey) ? priceValue : 1), amountStep);
                let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(priceBox, priceValue.toString());
                priceBox.dispatchEvent(new Event('input', { bubbles: true }));
                priceBox.dispatchEvent(new Event('change', { bubbles: true }));
                nativeInputValueSetter.call(amountBox, amountValue.toString());
                amountBox.dispatchEvent(new Event('input', { bubbles: true }));
                amountBox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            button = document.querySelector(thisBuyOrSellButton);
            if (button != null) button.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true, view: window } ) );
            prevent = true;
        }
        if (event.key == cancelOffersKey) {
            button = document.querySelector(offerCancelButtonSelector);
            if (button != null) button.dispatchEvent( new Event( 'click', { bubbles: true } ) );
            prevent = true;
        }
        if (event.key == resetKeybindsKey) {
            ensureDoWheelBinds = true;
            frameWaitWheel = frameWaitCap;
            frameWaitLimit = frameWaitCap;
            ensureDoLimitOnclicks = true;
            frameWaitTab = 0;
            prevent = true;
        }
        //if (event.key == "5") {
        //    alert("");
        //    prevent = true;
        //}
        if (prevent) {
            event.preventDefault();
            return false;
        }
    }
    function InitCanvas(element) {
        let toolTip = "Having this enabled will emulate clicks to the full buy and sell order book views to get the full depth (min/max of -5/+5%), but will also block any drop-down menus from appearing.\nWhile disabled, the bar will only represent the orders seen in the default order book view.";
        let toolTip2 = "Bar thickness indicates the trade history volume comparison\nBar length indicates the order book volume comparison";
        let checked = "";
        if (fullDepthByDefault) checked = " checked";
        element.innerHTML = "<input type=\"checkbox\" title=\"" + toolTip + "\"" + checked + "></input><canvas title=\"" + toolTip2 +"\"height=\"39\" id=\"mySpace\" style=\"height:39px;\"></canvas>";
        my_space = element.children[1];
        my_toggle_button = element.children[0];
    }
    function InitOtherCanvas(element) {
        my_other_space = document.createElement("canvas");
        element.insertBefore(my_other_space, element.children[3]);
        my_other_space.setAttribute("width", oneSecChartWidth.toString());
        my_other_space.setAttribute("height", oneSecChartHeight.toString());
        my_other_space.setAttribute("style", "width:" + oneSecChartWidth.toString() + "px;height:" + oneSecChartHeight.toString() + "px;");
    }
    function RGBof(arr) {
        if (arr.length == 3) return "rgb(" + arr[0] + "," + arr[1] + "," + arr[2] + ")";
        return "rgba(" + arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3] + ")";
    }
    function FakeClickTypeA(element) {
        element.dispatchEvent( new Event( 'click', { bubbles: true } ) );
    }
    function FakeClickTypeB(element) {
        element.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true, view: window } ) );
    }
    function MainLoop(callRecur=true) {
        if (callRecur) setTimeout(MainLoop, milisecondsBetweenUpdates);
        //let notifs = document.querySelectorAll(notificationSelector);
        //if ((notifs != null) && (notifs.length > 0)) {
        //    //alert(notifs.length); // yeah this shit isn't working
        //    let unpack = (element) => {
        //        let result = [];
        //        for (let j = 0; j < element.children.length; j++) {
        //            result.push(unpack(element.children[j]));
        //        }
        //        result.push(element);
        //        return result;
        //    };
        //    for (let i = 0; i < notifs.length; i++) {
        //        let allElementsOfNotification = unpack(notifs[i].parentElement.parentElement.parentElement.parentElement);
        //        for (let j = 0; j < allElementsOfNotification.length; j++) {
        //            let ele = allElementsOfNotification[j];
        //            ele.setAttribute("background-color", "rgba(0,0,0,0) !important");
        //        }
        //    }
        //}
        DoTabOnclicks();
        DoLimitOnclicks();
        DoWheelBinds();
        let sellFundsAvailElement = document.querySelector(sellFundsSelector);
        if (sellFundsAvailElement != null) {
            let sellAvail = sellFundsAvailElement.innerText;
            if (sellAvail.includes(" ")) {
                let buyFundsAvailElement = document.querySelector(buyFundsSelector);
                if (buyFundsAvailElement != null) {
                    let buyAvail = sellFundsAvailElement.innerText;
                    if (buyAvail.includes(" ")) {
                        let coin1 = buyAvail.substring(buyAvail.indexOf(" "), buyAvail.length);
                        let coin2 = sellAvail.substring(sellAvail.indexOf(" "), sellAvail.length);
                        let coin = coin1 + "/" + coin2;
                        if (coin != coinCurrentlyViewing) {
                            oneSecChart = [];
                            currentSecHigh = 0;
                            currentSecLow = 0;
                            currentSecOpen = 0;
                            currentSecClose = 0;
                            coinCurrentlyViewing = coin;
                            //alert("viewing new coin: " + coin);
                        }
                    }
                }
            }
        }
        let defaultOrderBookButton = document.querySelector(defaultOrderBookSelector);
        let buyOrderBookButton = document.querySelector(buyOrderBookSelector);
        let sellOrderBookButton = document.querySelector(sellOrderBookSelector);
        let currentPrice = document.querySelector(lastSaleSelector);
        let currentTime = document.querySelector(lastSaleTimeSelector);
        if (my_other_space == null) {
            let emptyBox = document.querySelector(myOtherEmptySpaceSelector);
            if (emptyBox != null) {
                InitOtherCanvas(emptyBox);
            }
        }
        else if (my_space == null) {
            let emptyBox = document.querySelector(emptySpaceSelector);
            if (emptyBox != null) {
                InitCanvas(emptyBox);
            }
        }
        else if (!([defaultOrderBookButton, buyOrderBookButton, sellOrderBookButton, currentTime].includes(null))) {
            if (callRecur && (currentPrice != null)) {
                currentPrice = Number(currentPrice.innerText.replaceAll(',',''));
                msInSecondCycle += milisecondsBetweenUpdates;
                let resetting = false;
                if (currentSecHigh == 0) {
                    currentSecHigh = currentPrice;
                    currentSecLow = currentPrice;
                    if (currentSecOpen == 0) currentSecOpen = currentPrice;
                    currentSecClose = currentPrice;
                }
                else {
                    currentSecLow = Math.min(currentSecLow, currentPrice);
                    currentSecHigh = Math.max(currentSecHigh, currentPrice);
                    currentSecClose = currentPrice;
                }
                if (msInSecondCycle >= msInOneSec) {
                    msInSecondCycle -= msInOneSec;
                    oneSecChart.unshift({"high":currentSecHigh,"low":currentSecLow,"open":currentSecOpen,"close":currentSecClose});
                    resetting = true;
                }
                if (oneSecChart.length >= oneSecChartWidth) oneSecChart.pop();
                let c = my_other_space.getContext("2d");
                let allTimeHigh = 0;
                let allTimeLow = 0;
                if (!resetting) oneSecChart.unshift({"high":currentSecHigh,"low":currentSecLow,"open":currentSecOpen,"close":currentSecClose});
                for (let i = 0; i < oneSecChart.length; i++) {
                    let stick = oneSecChart[i];
                    if (i == 0) {
                        allTimeHigh = stick.high;
                        allTimeLow = stick.low;
                    }
                    else {
                        allTimeHigh = Math.max(stick.high, allTimeHigh);
                        allTimeLow = Math.min(stick.low, allTimeLow);
                    }
                }
                let allTimeDiff = allTimeHigh - allTimeLow;
                let badStrokes = [];
                let semiBadStrokes = [];
                let semiGoodStrokes = [];
                let goodStrokes = [];
                let percentNotches = [];
                let stagnants = [];
                if (allTimeHigh > 0) {
                    let allTimeMid = (allTimeDiff / 2) + allTimeLow;
                    let heightScale = (oneSecChartHeight / allTimeDiff);
                    let onePercent = allTimeMid / 100;
                    let halfPercent = onePercent / 2;
                    for (let notchPoint = allTimeMid - halfPercent; notchPoint > allTimeLow; notchPoint *= (100/101)) {
                        let thisY = oneSecChartHeight - ((notchPoint - allTimeLow) * heightScale);
                        percentNotches.push({"start":[0, thisY],"end":[oneSecChartWidth, thisY]});
                    }
                    for (let notchPoint2 = allTimeMid + halfPercent; notchPoint2 < allTimeHigh; notchPoint2 *= 1.01) {
                        let thisY2 = oneSecChartHeight - ((notchPoint2 - allTimeLow) * heightScale);
                        percentNotches.push({"start":[0, thisY2],"end":[oneSecChartWidth, thisY2]});
                    }
                    for (let i = 0; i < oneSecChart.length; i++) {
                        let stick = oneSecChart[i];
                        let strokes = badStrokes;
                        let semiStrokes = semiBadStrokes;
                        if (stick.close > stick.open) {
                            strokes = goodStrokes;
                            semiStrokes = semiGoodStrokes;
                        }
                        let stickHigh = (stick.high - allTimeLow) * heightScale;
                        let stickLow = (stick.low - allTimeLow) * heightScale;
                        let stickOpen = (stick.open - allTimeLow) * heightScale;
                        let stickClose = (stick.close - allTimeLow) * heightScale;
                        let thisX = oneSecChartWidth - (i + 0.5);
                        if (stickOpen == stickClose) {
                            stickOpen -= 0.25;
                            stickClose += 0.25;
                            stagnants.push({"start":[thisX,oneSecChartHeight - stickOpen],"end":[thisX,oneSecChartHeight - stickClose]});
                        }
                        else {
                            strokes.push({"start":[thisX,oneSecChartHeight - stickOpen],"end":[thisX,oneSecChartHeight - stickClose]});
                            semiStrokes.push({"start":[thisX,oneSecChartHeight - stickHigh],"end":[thisX,oneSecChartHeight - stickLow]});
                        }
                    }
                }
                if (!resetting) oneSecChart.shift();
                c.clearRect(0, 0, oneSecChartWidth, oneSecChartHeight);
                if (percentNotches.length > 0) {
                    c.beginPath();
                    c.strokeStyle = RGBof(colourOnePercentNotch);
                    for (let i = 0; i < percentNotches.length; i++) {
                        let notch = percentNotches[i];
                        c.moveTo(...notch.start);
                        c.lineTo(...notch.end);
                    }
                    c.stroke();
                }
                c.beginPath();
                c.strokeStyle = RGBof(colourTimeNotch);
                for (let i = 0; i <= oneSecChartWidth; i += 60) {
                    let thisX = oneSecChartWidth - (i + 0.5);
                    c.moveTo(thisX, 0);
                    c.lineTo(thisX, oneSecChartHeight);
                }
                c.stroke();
                if (stagnants.length > 0) {
                    c.beginPath();
                    c.strokeStyle = RGBof(colourStagnant);
                    for (let i = 0; i < stagnants.length; i++) {
                        let stroke = stagnants[i];
                        c.moveTo(...stroke.start);
                        c.lineTo(...stroke.end);
                    }
                    c.stroke();
                }
                if (badStrokes.length > 0) {
                    // badstroke island
                    c.beginPath();
                    c.strokeStyle = RGBof(colourBadMid);
                    for (let i = 0; i < semiBadStrokes.length; i++) {
                        let stroke = semiBadStrokes[i];
                        c.moveTo(...stroke.start);
                        c.lineTo(...stroke.end);
                    }
                    c.stroke();
                    c.beginPath();
                    c.strokeStyle = RGBof(colourBad);
                    for (let i = 0; i < badStrokes.length; i++) {
                        let stroke = badStrokes[i];
                        c.moveTo(...stroke.start);
                        c.lineTo(...stroke.end);
                    }
                    c.stroke();
                }
                if (goodStrokes.length > 0) {
                    c.beginPath();
                    c.strokeStyle = RGBof(colourGoodMid);
                    for (let i = 0; i < semiGoodStrokes.length; i++) {
                        let stroke = semiGoodStrokes[i];
                        c.moveTo(...stroke.start);
                        c.lineTo(...stroke.end);
                    }
                    c.stroke();
                    c.beginPath();
                    c.strokeStyle = RGBof(colourGood);
                    for (let i = 0; i < goodStrokes.length; i++) {
                        let stroke = goodStrokes[i];
                        c.moveTo(...stroke.start);
                        c.lineTo(...stroke.end);
                    }
                    c.stroke();
                }
                if (resetting) {
                    currentSecHigh = 0;
                    currentSecOpen = currentPrice;
                }
            }
            // ---------------------- END OF 1-SEC CHART -------------------------
            msSinceOrderBookUpdate += milisecondsBetweenUpdates; // need this or else extreme CPU usage while in full depp mode
            if (msSinceOrderBookUpdate >= msBetweenOrderBookUpdates) {
                msSinceOrderBookUpdate -= msBetweenOrderBookUpdates;
                currentTime = currentTime.innerText;
                if (my_toggle_button.checked) FakeClickTypeA(buyOrderBookButton);
                let buyers = document.querySelectorAll(orderBookBuyersSelectorAll);
                if (my_toggle_button.checked) FakeClickTypeA(sellOrderBookButton);
                let sellers = document.querySelectorAll(orderBookSellersSelectorAll);
                if (my_toggle_button.checked) FakeClickTypeA(defaultOrderBookButton);
                let bought = document.querySelectorAll(tradeListItemBoughtSelectorAll);
                let sold = document.querySelectorAll(tradeListItemSoldSelectorAll);
                if (!([buyers, sellers].includes(null))) {
                    let c = my_space.getContext("2d");
                    let rect = my_space.getBoundingClientRect();
                    let width = rect.right - rect.left;
                    let totalBuyerVolume = 0.0;
                    let totalSellerVolume = 0.0;
                    let totalBought = 0.0;
                    let totalSold = 0.0;
                    let buyTop = 0;
                    let buyBottom = 0;
                    let sellTop = 0;
                    let sellBottom = 0;
                    let irisSizeGood = 0;
                    let irisSizeBad = 0;
                    let irisSizeThresh = 0.44;


                    if (bought != null) {
                        for (let i = 0; i < bought.length; i++) {
                            let ele = bought[i];
                            let price = Number(ele.children[0].innerText.replaceAll(',',''));
                            let amount = Number(ele.children[1].innerText.replaceAll(',',''));
                            let total = price * amount;
                            if ((total == 0) || (price == 0)) continue;
                            totalBought += total;
                            if (ele.children[2].innerText == currentTime) {
                                buyTop = Math.max(price, buyTop);
                                if (buyBottom == 0) buyBottom = price;
                                else buyBottom = Math.min(price, buyBottom);
                            }
                        }
                    }
                    if (sold != null) {
                        for (let i = 0; i < sold.length; i++) {
                            let ele = sold[i];
                            let price = Number(ele.children[0].innerText.replaceAll(',',''));
                            let amount = Number(ele.children[1].innerText.replaceAll(',',''));
                            let total = price * amount;
                            if ((total == 0) || (price == 0)) continue;
                            totalSold += total;
                            if (ele.children[2].innerText == currentTime) {
                                sellTop = Math.max(price, sellTop);
                                if (sellBottom == 0) sellBottom = price;
                                else sellBottom = Math.min(price, sellBottom);
                            }
                        }
                    }
                    latestBuyLow = buyBottom;
                    latestSellHigh = sellTop;
                    latestSellLow = sellBottom;
                    latestBuyHigh = buyTop;
                    latestHigh = Math.max(buyTop, sellTop);
                    if ((sellBottom == 0) || (buyBottom == 0)) latestLow = sellBottom + buyBottom;
                    else latestLow = Math.min(buyBottom, sellBottom);
                    if (latestLow > 0) {
                        lows.unshift(latestLow);
                        highs.unshift(latestHigh);
                    }
                    if (highs.length > maxEles) highs.pop();
                    if (lows.length > maxEles) lows.pop();
                    latestHigh = Math.max(...highs);
                    latestLow = Math.min(...lows);
                    let firstBuy = 0;
                    for (let i = 0; i < buyers.length; i++) {
                        let ele = buyers[i];
                        let price = Number(ele.children[0].innerText.replaceAll(',',''));
                        if (i == 0) {
                            firstBuy = price;
                        }
                        if (price > firstBuy * 0.95) {
                            let amount = Number(ele.children[1].innerText.replaceAll(',',''));
                            let total = Number(ele.children[2].innerText.replaceAll(',',''));
                            totalBuyerVolume += total;
                        }
                    }
                    let firstSell = 0;
                    for (let i = sellers.length - 1; i >= 0; i--) {
                        let ele = sellers[i];
                        let price = Number(ele.children[0].innerText.replaceAll(',',''));
                        if (i == sellers.length - 1) {
                            firstSell = price;
                        }
                        if (price < firstSell * 1.05) {
                            let amount = Number(ele.children[1].innerText.replaceAll(',',''));
                            let total = Number(ele.children[2].innerText.replaceAll(',',''));
                            totalSellerVolume += total;
                        }
                    }
                    let totalOrders = totalBuyerVolume + totalSellerVolume;
                    let buyerFillAmount = (totalBuyerVolume / totalOrders) * width;
                    let sellerFillAmount = (totalSellerVolume / totalOrders) * width;
                    totalBought = Math.max(totalBought, 0.000000000001);
                    totalSold = Math.max(totalSold, 0.000000000001);
                    let totalTraded = totalBought + totalSold;
                    irisSizeGood = 0.05 + ((totalBought / totalTraded) * irisSizeThresh);
                    irisSizeBad = 0.05 + ((totalSold / totalTraded) * irisSizeThresh);
                    let buylingrad = c.createLinearGradient(0, 0, 0, 39);
                    buylingrad.addColorStop(0, RGBof(colourBackground));
                    buylingrad.addColorStop(0.5 - irisSizeGood, RGBof(colourGoodMid));
                    buylingrad.addColorStop(0.5 - (irisSizeGood - 0.045), RGBof(colourGood));
                    buylingrad.addColorStop(0.5, RGBof(colourGood));
                    buylingrad.addColorStop(0.5 + (irisSizeGood - 0.045), RGBof(colourGood));
                    buylingrad.addColorStop(0.5 + irisSizeGood, RGBof(colourGoodMid));
                    buylingrad.addColorStop(1, RGBof(colourBackground));
                    let sellingrad = c.createLinearGradient(0, 0, 0, 39);
                    sellingrad.addColorStop(0, RGBof(colourBackground));
                    sellingrad.addColorStop(0.5 - irisSizeBad, RGBof(colourBadMid));
                    sellingrad.addColorStop(0.5 - (irisSizeBad - 0.045), RGBof(colourBad));
                    sellingrad.addColorStop(0.5, RGBof(colourBad));
                    sellingrad.addColorStop(0.5 + (irisSizeBad - 0.045), RGBof(colourBad));
                    sellingrad.addColorStop(0.5 + irisSizeBad, RGBof(colourBadMid));
                    sellingrad.addColorStop(1, RGBof(colourBackground));
                    c.clearRect(0, 0, width, 39);
                    c.fillStyle = buylingrad;
                    c.fillRect(0, 0, buyerFillAmount, 39);
                    c.fillStyle = sellingrad;
                    c.fillRect(width - sellerFillAmount, 0, sellerFillAmount, 39);
                }
            }
        }
    }
    function DoWheelBinds() {
        if (ensureDoWheelBinds) {
            sell_price_box = document.getElementById("FormRow-SELL-price");
            buy_price_box = document.getElementById("FormRow-BUY-price");
            sell_amount_box = document.getElementById("FormRow-SELL-quantity");
            buy_amount_box = document.getElementById("FormRow-BUY-quantity");
            if ([sell_price_box, buy_price_box, sell_amount_box, buy_amount_box].includes(null) || (frameWaitWheel-- > 0)) return;
            try {
                sell_price_box.parentElement.removeEventListener("wheel", WheelBindSellPrice, true);
            } catch {}
            try {
                buy_price_box.parentElement.removeEventListener("wheel", WheelBindBuyPrice, true);
            } catch {}
            try {
                sell_amount_box.parentElement.removeEventListener("wheel", WheelBindSellAmount, true);
            } catch {}
            try {
                buy_amount_box.parentElement.removeEventListener("wheel", WheelBindBuyAmount, true);
            } catch {}
            sell_price_box.parentElement.addEventListener("wheel", WheelBindSellPrice, true);
            buy_price_box.parentElement.addEventListener("wheel", WheelBindBuyPrice, true);
            sell_amount_box.parentElement.addEventListener("wheel", WheelBindSellAmount, true);
            buy_amount_box.parentElement.addEventListener("wheel", WheelBindBuyAmount, true);
            ensureDoWheelBinds = false;
            frameWaitWheel = frameWaitCap;
        }
    }
    function DoLimitOnclicks() {
        if (ensureDoLimitOnclicks) {
            let limitButton = document.querySelector(limitOfferButtonSelector);
            if (limitButton != null) {
                if (frameWaitLimit-- > 0) return;
                limitButton.addEventListener("mouseup", (event) => {setTimeout(()=>{ensureDoWheelBinds = true;}, 100);}, true);
                ensureDoLimitOnclicks = false;
                frameWaitLimit = frameWaitCap;
            }
        }
    }
    let doneSpotOnclick = false;
    let doneCrossOnclick = false;
    let doneIsolatedOnclick = false;
    let maxFramesToWaitForTabs = 500;
    function DoTabOnclicks() {
        if (!doneSpotOnclick) {
            let spotTab = document.querySelector(orderTypeTabSelectorSpot);
            if (spotTab != null) {
                spotTab.addEventListener("mouseup", (event) => {setTimeout(()=>{ensureDoLimitOnclicks = true; ensureDoWheelBinds = true;}, 100);}, true);
                doneSpotOnclick = true;
            }
        }
        if (frameWaitTab < maxFramesToWaitForTabs) {
            if (!doneCrossOnclick) {
                let crossTab = document.querySelector(orderTypeTabSelectorCross);
                if (crossTab != null) {
                    crossTab.addEventListener("mouseup", (event) => {setTimeout(()=>{ensureDoLimitOnclicks = true; ensureDoWheelBinds = true;}, 100);}, true);
                    doneCrossOnclick = true;
                }
            }
            if (!doneIsolatedOnclick) {
                let isolatedTab = document.querySelector(orderTypeTabSelectorIsolated);
                if (isolatedTab != null) {
                    isolatedTab.addEventListener("mouseup", (event) => {setTimeout(()=>{ensureDoLimitOnclicks = true; ensureDoWheelBinds = true;}, 100);}, true);
                    doneIsolatedOnclick = true;
                }
            }
            if (doneIsolatedOnclick && doneCrossOnclick) frameWaitTab = maxFramesToWaitForTabs;
            frameWaitTab++
        }
    }
    document.addEventListener("keydown", GenericKeyDown, true);
    MainLoop(true);
    //InitialWork(false);
})();
