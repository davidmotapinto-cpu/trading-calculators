//+------------------------------------------------------------------+
//|                                    TradingCalculatorPanel.mq5      |
//|  On-chart trading calculator panel — Margin / Point Value /        |
//|  Profit&Loss / Swap, read-only display only. Places no orders,     |
//|  modifies no positions. Built as an Indicator (not an EA) since    |
//|  it never trades — only an EA can call OrderSend, and this never   |
//|  does.                                                              |
//|                                                                      |
//|  Uses the terminal's own broker-aware functions (OrderCalcMargin,  |
//|  OrderCalcProfit, SymbolInfo*) instead of reimplementing contract  |
//|  spec / margin / currency-conversion math — more accurate than a   |
//|  hand-rolled formula because it reflects this broker's actual      |
//|  tiered margin and currency conversion rules.                      |
//|                                                                      |
//|  Install: copy this file into                                      |
//|  <Terminal Data Folder>\MQL5\Indicators\, then in MetaEditor        |
//|  press F7 to compile, then drag it onto a chart from the           |
//|  Navigator. See mt5/README.md for details.                         |
//+------------------------------------------------------------------+
#property copyright "Equiti Trading Calculators"
#property version   "1.00"
#property indicator_chart_window
#property indicator_plots 0

#include <Controls\Dialog.mqh>
#include <Controls\Button.mqh>
#include <Controls\Edit.mqh>
#include <Controls\Label.mqh>

input int InpPanelX = 20;   // Panel X position
input int InpPanelY = 40;   // Panel Y position

#define PANEL_W 340
#define PANEL_H 470
#define ROW_H   24

//+------------------------------------------------------------------+
//| The panel itself                                                  |
//+------------------------------------------------------------------+
class CCalcPanel : public CAppDialog
  {
private:
   CLabel   m_lblAccount;
   CLabel   m_lblSymbolTag;   CEdit    m_edtSymbol;
   CButton  m_btnBuy, m_btnSell;
   CLabel   m_lblLotsTag;     CEdit    m_edtLots;
   CLabel   m_lblOpenTag;     CEdit    m_edtOpen;
   CLabel   m_lblCloseTag;    CEdit    m_edtClose;
   CLabel   m_lblNightsTag;   CEdit    m_edtNights;
   CButton  m_btnCalc;
   CButton  m_btnUseMarket;

   CLabel   m_lblMarginTag,   m_lblMarginVal;
   CLabel   m_lblMarginPctTag,m_lblMarginPctVal;
   CLabel   m_lblPointTag,    m_lblPointVal;
   CLabel   m_lblPLTag,       m_lblPLVal;
   CLabel   m_lblSwapTag,     m_lblSwapVal;
   CLabel   m_lblRiskTag,     m_lblRiskVal;
   CLabel   m_lblNote;

   bool     m_isBuy;

   bool     AddLabel(CLabel &lbl, const string name, int x1, int y1, int x2, int y2, string text, color clr = clrBlack);
   bool     AddEdit(CEdit &edt, const string name, int x1, int y1, int x2, int y2, string text);
   bool     AddButton(CButton &btn, const string name, int x1, int y1, int x2, int y2, string text);

public:
            CCalcPanel(void) : m_isBuy(true) {}
           ~CCalcPanel(void) {}

   bool     CreateAll(const long chart, const string name, const int subwin);
   void     Recalculate(void);
   void     SetDirection(bool isBuy);
   void     UseMarketPrices(void);
   virtual bool OnEvent(const int id, const long &lparam, const double &dparam, const string &sparam);

   void     OnClickBuy(void)  { SetDirection(true); }
   void     OnClickSell(void) { SetDirection(false); }
   void     OnClickCalc(void) { Recalculate(); }
   void     OnClickUseMarket(void) { UseMarketPrices(); Recalculate(); }
  };

// The event-map macros expand into the definition of CCalcPanel::OnEvent —
// they must sit outside the class body (this is the standard MQL5 Controls
// library pattern), not nested inside it.
EVENT_MAP_BEGIN(CCalcPanel)
ON_EVENT(ON_CLICK, m_btnBuy, OnClickBuy)
ON_EVENT(ON_CLICK, m_btnSell, OnClickSell)
ON_EVENT(ON_CLICK, m_btnCalc, OnClickCalc)
ON_EVENT(ON_CLICK, m_btnUseMarket, OnClickUseMarket)
EVENT_MAP_END(CAppDialog)

//+------------------------------------------------------------------+
bool CCalcPanel::AddLabel(CLabel &lbl, const string name, int x1, int y1, int x2, int y2, string text, color clr)
  {
   if(!lbl.Create(m_chart_id, name, m_subwin, x1, y1, x2, y2))
      return false;
   lbl.Text(text);
   lbl.Color(clr);
   if(!Add(lbl))
      return false;
   return true;
  }

bool CCalcPanel::AddEdit(CEdit &edt, const string name, int x1, int y1, int x2, int y2, string text)
  {
   if(!edt.Create(m_chart_id, name, m_subwin, x1, y1, x2, y2))
      return false;
   edt.Text(text);
   if(!Add(edt))
      return false;
   return true;
  }

bool CCalcPanel::AddButton(CButton &btn, const string name, int x1, int y1, int x2, int y2, string text)
  {
   if(!btn.Create(m_chart_id, name, m_subwin, x1, y1, x2, y2))
      return false;
   btn.Text(text);
   if(!Add(btn))
      return false;
   return true;
  }

//+------------------------------------------------------------------+
//| Build every control. Coordinates are relative to the dialog.      |
//+------------------------------------------------------------------+
bool CCalcPanel::CreateAll(const long chart, const string name, const int subwin)
  {
   if(!Create(chart, name, subwin, InpPanelX, InpPanelY, InpPanelX + PANEL_W, InpPanelY + PANEL_H))
      return false;

   int y = 28;
   string acctLine = StringFormat("Balance %s   Equity %s   Leverage 1:%d",
                                   DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2),
                                   DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2),
                                   (int)AccountInfoInteger(ACCOUNT_LEVERAGE));
   AddLabel(m_lblAccount, name + "Acct", 10, y, PANEL_W - 10, y + ROW_H, acctLine, clrDimGray);
   y += ROW_H + 6;

   AddLabel(m_lblSymbolTag, name + "SymTag", 10, y, 90, y + ROW_H, "Symbol");
   AddEdit(m_edtSymbol, name + "SymEdt", 100, y, PANEL_W - 10, y + ROW_H, _Symbol);
   y += ROW_H + 6;

   AddButton(m_btnBuy,  name + "Buy",  10, y, 165, y + ROW_H, "Buy");
   AddButton(m_btnSell, name + "Sell", 175, y, PANEL_W - 10, y + ROW_H, "Sell");
   m_btnBuy.ColorBackground(clrLightGreen);
   y += ROW_H + 6;

   AddLabel(m_lblLotsTag, name + "LotsTag", 10, y, 90, y + ROW_H, "Lot Size");
   AddEdit(m_edtLots, name + "LotsEdt", 100, y, PANEL_W - 10, y + ROW_H, "1.0");
   y += ROW_H + 6;

   AddLabel(m_lblOpenTag, name + "OpenTag", 10, y, 90, y + ROW_H, "Open Price");
   AddEdit(m_edtOpen, name + "OpenEdt", 100, y, PANEL_W - 10, y + ROW_H, "0.0");
   y += ROW_H + 6;

   AddLabel(m_lblCloseTag, name + "CloseTag", 10, y, 90, y + ROW_H, "Close Price");
   AddEdit(m_edtClose, name + "CloseEdt", 100, y, PANEL_W - 10, y + ROW_H, "0.0");
   y += ROW_H + 6;

   AddLabel(m_lblNightsTag, name + "NightsTag", 10, y, 90, y + ROW_H, "Nights");
   AddEdit(m_edtNights, name + "NightsEdt", 100, y, PANEL_W - 10, y + ROW_H, "1");
   y += ROW_H + 8;

   AddButton(m_btnUseMarket, name + "UseMkt", 10, y, 165, y + ROW_H, "Use Market Price");
   AddButton(m_btnCalc, name + "Calc", 175, y, PANEL_W - 10, y + ROW_H, "Calculate");
   y += ROW_H + 12;

   color outClr = clrNavy;
   AddLabel(m_lblMarginTag, name + "MarginTag", 10, y, 150, y + ROW_H, "Required Margin");
   AddLabel(m_lblMarginVal, name + "MarginVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 2;

   AddLabel(m_lblMarginPctTag, name + "MarginPctTag", 10, y, 150, y + ROW_H, "Margin % of Equity");
   AddLabel(m_lblMarginPctVal, name + "MarginPctVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 2;

   AddLabel(m_lblPointTag, name + "PointTag", 10, y, 150, y + ROW_H, "Value per Point");
   AddLabel(m_lblPointVal, name + "PointVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 2;

   AddLabel(m_lblPLTag, name + "PLTag", 10, y, 150, y + ROW_H, "Profit / Loss");
   AddLabel(m_lblPLVal, name + "PLVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 2;

   AddLabel(m_lblSwapTag, name + "SwapTag", 10, y, 150, y + ROW_H, "Swap (total)");
   AddLabel(m_lblSwapVal, name + "SwapVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 2;

   AddLabel(m_lblRiskTag, name + "RiskTag", 10, y, 150, y + ROW_H, "Risk Level");
   AddLabel(m_lblRiskVal, name + "RiskVal", 160, y, PANEL_W - 10, y + ROW_H, "-", outClr);
   y += ROW_H + 10;

   AddLabel(m_lblNote, name + "Note", 10, y, PANEL_W - 10, y + 40,
            "Display only — places no orders. Figures use this broker's\nactual contract specs via OrderCalcMargin/OrderCalcProfit.", clrDimGray);

   SetDirection(true);
   UseMarketPrices();
   Recalculate();
   return true;
  }

//+------------------------------------------------------------------+
void CCalcPanel::SetDirection(bool isBuy)
  {
   m_isBuy = isBuy;
   m_btnBuy.ColorBackground(isBuy ? clrLightGreen : clrWhiteSmoke);
   m_btnSell.ColorBackground(isBuy ? clrWhiteSmoke : clrSalmon);
  }

//+------------------------------------------------------------------+
void CCalcPanel::UseMarketPrices(void)
  {
   string symbol = m_edtSymbol.Text();
   if(!SymbolSelect(symbol, true))
      return;
   double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double openPrice = m_isBuy ? ask : bid;
   m_edtOpen.Text(DoubleToString(openPrice, digits));
   m_edtClose.Text(DoubleToString(openPrice, digits));
  }

//+------------------------------------------------------------------+
//| The actual calculation — everything here delegates to the        |
//| terminal's own broker-aware functions rather than reimplementing |
//| contract-spec / margin / swap math.                               |
//+------------------------------------------------------------------+
void CCalcPanel::Recalculate(void)
  {
   string symbol = m_edtSymbol.Text();
   if(!SymbolSelect(symbol, true))
     {
      m_lblNote.Text("Unknown symbol: " + symbol);
      return;
     }

   double lots = StringToDouble(m_edtLots.Text());
   double openPrice = StringToDouble(m_edtOpen.Text());
   double closePrice = StringToDouble(m_edtClose.Text());
   double nights = StringToDouble(m_edtNights.Text());
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);

   if(lots <= 0 || openPrice <= 0)
     {
      m_lblNote.Text("Lot size and open price must be greater than zero.");
      return;
     }

   ENUM_ORDER_TYPE orderType = m_isBuy ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   string ccy = AccountInfoString(ACCOUNT_CURRENCY);

   // --- Margin: broker-calculated, including any tiered margin rules ---
   double margin = 0.0;
   OrderCalcMargin(orderType, symbol, lots, openPrice, margin);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double marginPct = equity > 0 ? (margin / equity) * 100.0 : 0.0;
   m_lblMarginVal.Text(DoubleToString(margin, 2) + " " + ccy);
   m_lblMarginPctVal.Text(DoubleToString(marginPct, 1) + "%");

   // --- Value per point: tick value scaled to this symbol's point size ---
   double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   double point     = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double pointValue = (tickSize > 0) ? tickValue * (point / tickSize) * lots : 0.0;
   m_lblPointVal.Text(DoubleToString(pointValue, 2) + " " + ccy + " / point");

   // --- Profit/Loss: broker-calculated for the open->close move ---
   double profit = 0.0;
   OrderCalcProfit(orderType, symbol, lots, openPrice, closePrice, profit);
   m_lblPLVal.Text((profit >= 0 ? "+" : "") + DoubleToString(profit, 2) + " " + ccy);
   m_lblPLVal.Color(profit >= 0 ? clrForestGreen : clrCrimson);

   // --- Swap: SYMBOL_SWAP_LONG/SHORT, mode-dependent units ---
   double swapRaw = m_isBuy ? SymbolInfoDouble(symbol, SYMBOL_SWAP_LONG) : SymbolInfoDouble(symbol, SYMBOL_SWAP_SHORT);
   ENUM_SYMBOL_SWAP_MODE swapMode = (ENUM_SYMBOL_SWAP_MODE)SymbolInfoInteger(symbol, SYMBOL_SWAP_MODE);
   double swapTotal = 0.0;
   string swapNote = "";
   if(swapMode == SYMBOL_SWAP_MODE_POINTS)
     {
      // swapRaw is in points; convert points -> money the same way as pointValue above
      double perNight = swapRaw * (tickSize > 0 ? tickValue * (point / tickSize) : 0.0) * lots;
      swapTotal = perNight * nights;
     }
   else if(swapMode == SYMBOL_SWAP_MODE_DISABLED)
     {
      swapTotal = 0.0;
      swapNote = " (no swap on this symbol)";
     }
   else
     {
      // CURRENCY_SYMBOL / CURRENCY_MARGIN / CURRENCY_DEPOSIT modes: broker
      // quotes SYMBOL_SWAP_LONG/SHORT directly as money per lot per day in
      // the relevant currency — treated here as account currency. Verify
      // against your broker's contract specification if it differs.
      swapTotal = swapRaw * lots * nights;
     }
   m_lblSwapVal.Text((swapTotal >= 0 ? "+" : "") + DoubleToString(swapTotal, 2) + " " + ccy + swapNote);
   m_lblSwapVal.Color(swapTotal >= 0 ? clrForestGreen : clrCrimson);

   // --- Risk note: same thresholds as the web calculator ---
   string riskLevel = "LOW";
   color riskColor = clrForestGreen;
   double lossPct = equity > 0 ? (MathAbs(MathMin(0.0, profit + swapTotal)) / equity) * 100.0 : 0.0;
   if(lossPct >= 10.0 || marginPct >= 50.0) { riskLevel = "HIGH"; riskColor = clrCrimson; }
   else if(lossPct >= 5.0 || marginPct >= 25.0) { riskLevel = "MEDIUM"; riskColor = clrOrange; }
   m_lblRiskVal.Text(riskLevel);
   m_lblRiskVal.Color(riskColor);

   m_lblNote.Text("Display only — places no orders. Figures use this broker's\nactual contract specs via OrderCalcMargin/OrderCalcProfit.");
  }

CCalcPanel ExtPanel;

//+------------------------------------------------------------------+
int OnInit()
  {
   if(!ExtPanel.CreateAll(0, PANEL_NAME, 0))
     {
      Print("TradingCalculatorPanel: failed to create panel");
      return INIT_FAILED;
     }
   ExtPanel.Run();
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason)
  {
   ExtPanel.Destroy(reason);
  }

int OnCalculate(const int rates_total, const int prev_calculated, const datetime &time[],
                const double &open[], const double &high[], const double &low[], const double &close[],
                const long &tick_volume[], const long &volume[], const int &spread[])
  {
   return rates_total;
  }

void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
  {
   ExtPanel.ChartEvent(id, lparam, dparam, sparam);
  }
//+------------------------------------------------------------------+
