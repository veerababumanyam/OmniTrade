**Gemini Layer 1:** Switch to **Gemini 3 Pro** (Link in bio). We are using the 'Layering Method.' Type this:

*'I am providing the source code for the ATR VStop indicator. Analyze the logic. Do not write a strategy yet. Just confirm you understand how the Multiplier affects the stop loss.'*

(Visual: Paste code. Watch Gemini analyze.) Gemini now understands our risk parameters. This is crucial for later."

**Gemini Layer 2:** Back to Gemini. Prompt:

*'Here is the source code for the second indicator: Blackflag FTS. Analyze the trend detection logic. Confirm when you are ready to merge this with the VStop.'*

(Visual: Paste code.) Now Gemini holds both systems in its short-term memory. It knows the volatility math (VStop) and the trend math (Blackflag). Now we combine them."

\*'Act as a Senior Pine Script Developer. Create a strategy that combines these two indicators. Rules:

1. Long Entry: Price is ABOVE VStop (Green) AND Blackflag is Green.  
2. Short Entry: Price is BELOW VStop (Red) AND Blackflag is Red.  
3. Exits: Close Long when VStop turns Red. Close Short when VStop turns Green.  
4. Hardcode the VStop settings to 22 and 3.0.  
5. **Risk Management:** Important\! Set the Strategy Properties to use 100% of equity, but enter trades with calculated risk.'\*

(Visual: Generate code. Copy it. Paste into TradingView Pine Editor. Save.)

FINAL SCRIPT \- 

//**@version=**5  
strategy("VStop \+ Blackflag Combo Strategy (Long Only)",  
     overlay\=true,  
     default\_qty\_type\=strategy.percent\_of\_equity,  
     default\_qty\_value\=100,  
     initial\_capital\=10000,  
     currency\=currency.USD)

// \==========================================  
// 🔹 INPUTS  
// \==========================================

// \--- VStop Inputs (Hardcoded defaults: 22, 3.0) \---  
vstop\_length \= 22  
vstop\_factor \= 3.0

// \--- Blackflag Inputs \---  
grp\_bf      \= "Blackflag Settings"  
bf\_type     \= input.string("modified", "Trailtype", options \= \["modified", "unmodified"\], group\=grp\_bf)  
bf\_atr\_len  \= input.int(28, "ATR Period", group\=grp\_bf)  
bf\_atr\_fac  \= input.float(5.0, "ATR Factor", group\=grp\_bf)

// \==========================================  
// 🔹 INDICATOR 1: ATR VStop (Hardcoded)  
// \==========================================

volStop(src, atrlen, atrfactor) \=\>  
    var max     \= src  
    var min     \= src  
    var uptrend \= true  
    var stop    \= 0.0  
    atrM        \= nz(ta.atr(atrlen) \* atrfactor, ta.tr)  
     
    max         := math.max(max, src)  
    min         := math.min(min, src)  
     
    stop        := nz(uptrend ? math.max(stop, max \- atrM) : math.min(stop, min \+ atrM), src)  
    uptrend     := src \- stop \>= 0.0  
     
    if uptrend \!= nz(uptrend\[1\], true)  
        max     := src  
        min     := src  
        stop    := uptrend ? max \- atrM : min \+ atrM  
    \[stop, uptrend\]

\[vStopVal, vStopBullish\] \= volStop(close, vstop\_length, vstop\_factor)

// Plot VStop for visual confirmation  
plot(vStopVal, "VStop", color\=vStopBullish ? color.green : color.red, linewidth\=2)

// \==========================================  
// 🔹 INDICATOR 2: Blackflag FTS  
// \==========================================

// Helper: Wilder's MA  
Wild\_ma(\_src, \_malength) \=\>  
    \_wild  \= 0.0  
    \_wild := nz(\_wild\[1\]) \+ (\_src \- nz(\_wild\[1\])) / \_malength

// Helper: Blackflag Range Calculation  
get\_bf\_range(period, type) \=\>  
    hilo \= math.min(high \- low, 1.5 \* nz(ta.sma(high \- low, period)))  
    href \= low \<= high\[1\] ? high \- close\[1\] : (high \- close\[1\]) \- 0.5 \* (low \- high\[1\])  
    lref \= high \>= low\[1\] ? close\[1\] \- low : (close\[1\] \- low) \- 0.5 \* (low\[1\] \- high)  
     
    type \== "modified" ? math.max(hilo, href, lref) : math.max(high \- low, math.abs(high \- close\[1\]), math.abs(low \- close\[1\]))

// Logic  
bf\_range \= get\_bf\_range(bf\_atr\_len, bf\_type)  
bf\_loss  \= bf\_atr\_fac \* Wild\_ma(bf\_range, bf\_atr\_len)

bf\_up \= close \- bf\_loss  
bf\_dn \= close \+ bf\_loss

var bf\_trend\_up \= 0.0  
var bf\_trend\_dn \= 0.0  
var bf\_trend    \= 1

bf\_trend\_up   := close\[1\] \> bf\_trend\_up\[1\] ? math.max(bf\_up, bf\_trend\_up\[1\]) : bf\_up  
bf\_trend\_dn   := close\[1\] \< bf\_trend\_dn\[1\] ? math.min(bf\_dn, bf\_trend\_dn\[1\]) : bf\_dn

bf\_trend      := close \> bf\_trend\_dn\[1\] ? 1 : close \< bf\_trend\_up\[1\] ? \-1 : nz(bf\_trend\[1\], 1)

// Plot Blackflag State  
plotshape(bf\_trend \== 1, "BF Bull", shape.circle, location.bottom, color.lime, size\=size.tiny)  
plotshape(bf\_trend \== \-1, "BF Bear", shape.circle, location.bottom, color.red, size\=size.tiny)

// \==========================================  
// 🔹 STRATEGY EXECUTION (LONG ONLY)  
// \==========================================

// Entry Condition: VStop is Green AND Blackflag is Green  
longCondition  \= vStopBullish and bf\_trend \== 1

// Execute Long Entry  
if (longCondition)  
    strategy.entry("Long", strategy.long, comment\="L | VStop+BF")

// Exit Condition: Close Long immediately if VStop turns Red  
if (strategy.position\_size \> 0 and not vStopBullish)  
    strategy.close("Long", comment\="Exit L (VStop Flip)")  
