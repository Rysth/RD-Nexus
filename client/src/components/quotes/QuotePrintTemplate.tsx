import { forwardRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Quote } from "@/stores/quoteStore";
import logo from "@/assets/logo.png";

interface Business {
  id: number;
  name: string;
  legal_name?: string | null;
  ruc?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  logo_url?: string | null;
}

interface QuotePrintTemplateProps {
  quote: Quote;
  business: Business | null;
}

const QuotePrintTemplate = forwardRef<HTMLDivElement, QuotePrintTemplateProps>(
  ({ quote, business }, ref) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value);
    };

    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), "dd/MMMM/yyyy", { locale: es });
      } catch {
        return dateStr;
      }
    };

    return (
      <div ref={ref} className="quote-print-template">
        {/* Header */}
        <div className="quote-header">
          <div className="quote-header-left">
            <img src={logo} alt="RysthDesign" className="quote-logo" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="quote-business-name">Nexus</div>
              <div
                style={{
                  fontSize: "0.9em",
                  fontStyle: "italic",
                  color: "#6b7280",
                  lineHeight: "1",
                }}
              >
                By RysthDesign
              </div>
            </div>
          </div>
          <div className="quote-header-right">
            <h1 className="quote-title">COTIZACIÓN</h1>
            <p className="quote-subtitle">{quote.title.toUpperCase()}</p>
          </div>
        </div>

        {/* Info Row */}
        <div className="quote-info-row">
          <div className="quote-info-left">
            <div className="quote-section" style={{ marginBottom: 0 }}>
              <div className="quote-section-header">
                <span>De</span>
              </div>
              <div className="quote-client-info">
                <div className="quote-info-item">
                  <span className="quote-info-label">Nombre:</span>
                  <span className="quote-info-value">
                    {business?.legal_name || "RysthDesign"}
                  </span>
                </div>
                <div className="quote-info-item">
                  <span className="quote-info-label">Celular:</span>
                  <span className="quote-info-value quote-link">
                    0988949117
                  </span>
                </div>
                <div className="quote-info-item">
                  <span className="quote-info-label">Email:</span>
                  <span className="quote-info-value quote-link">
                    support@rysthdesign.com
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="quote-info-right">
            <div className="quote-section" style={{ marginBottom: 0 }}>
              <div className="quote-section-header">
                <span>Detalles</span>
              </div>
              <div className="quote-client-info">
                <div className="quote-info-item">
                  <span className="quote-info-label">Fecha:</span>
                  <span className="quote-info-value">
                    {formatDate(quote.issue_date)}
                  </span>
                </div>
                <div className="quote-info-item">
                  <span className="quote-info-label">Cotización #:</span>
                  <span className="quote-info-value">{quote.quote_number}</span>
                </div>
                <div className="quote-info-item">
                  <span className="quote-info-label">Válida hasta:</span>
                  <span className="quote-info-value">
                    {formatDate(quote.valid_until)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Section */}
        <div className="quote-section">
          <div className="quote-section-header">
            <span>Documento Para</span>
          </div>
          <div className="quote-client-info">
            <div className="quote-client-row">
              <div className="quote-info-item">
                <span className="quote-info-label">Nombre:</span>
                <span className="quote-info-value">
                  {quote.client?.name || "N/A"}
                </span>
              </div>
              <div className="quote-info-item">
                <span className="quote-info-label">Negocio:</span>
                <span className="quote-info-value">
                  {quote.project?.name || quote.client?.name || "N/A"}
                </span>
              </div>
            </div>
            <div className="quote-info-item">
              <span className="quote-info-label">Celular:</span>
              <span className="quote-info-value quote-link">
                {quote.client?.phone || "N/A"}
              </span>
            </div>
            <div className="quote-info-item">
              <span className="quote-info-label">Email:</span>
              <span className="quote-info-value">
                {quote.client?.email || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="quote-section">
          <div className="quote-section-header">
            <span>Detalle de Venta</span>
          </div>
          <table className="quote-table">
            <thead>
              <tr>
                <th className="col-desc">Descripción</th>
                <th className="col-qty">Cantidad</th>
                <th className="col-price">P. Unitario</th>
                <th className="col-type">Tipo</th>
                <th className="col-subtotal">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items?.map((item, index) => {
                const itemIva = (item.subtotal * quote.tax_rate) / 100;
                const paymentTypeLabel =
                  item.payment_type === "mensual"
                    ? "Mensual"
                    : item.payment_type === "anual"
                      ? "Anual"
                      : "Único";
                return (
                  <tr key={item.id || index}>
                    <td className="col-desc">
                      <div style={{ fontWeight: 500 }}>{item.description}</div>
                      {item.notes && (
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "#6b7280",
                            marginTop: "4px",
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="col-qty">{item.quantity}</td>
                    <td className="col-price">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="col-type">{paymentTypeLabel}</td>
                    <td className="col-subtotal">
                      {formatCurrency(item.subtotal + itemIva)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="quote-totals">
            <div className="quote-total-row">
              <span className="quote-total-label">Subtotal</span>
              <span className="quote-total-value">
                {formatCurrency(quote.subtotal)}
              </span>
            </div>
            <div className="quote-total-row">
              <span className="quote-total-label">IVA ({quote.tax_rate}%)</span>
              <span className="quote-total-value">
                {formatCurrency(quote.tax_amount)}
              </span>
            </div>
            <div className="quote-total-row quote-total-final">
              <span className="quote-total-label">TOTAL</span>
              <span className="quote-total-value">
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {quote.terms_conditions && (
          <div className="quote-section">
            <div className="quote-section-header">
              <span>Términos y Condiciones</span>
            </div>
            <div className="quote-terms">
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.85em",
                  lineHeight: "1.5",
                }}
              >
                {quote.terms_conditions}
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="quote-section">
            <div className="quote-section-header">
              <span>Notas</span>
            </div>
            <div className="quote-notes">
              <p>{quote.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="quote-footer">
          <p>Gracias por su preferencia</p>
          <div className="quote-footer-powered">
            <p>
              Powered by <strong>RysthDesign</strong>
            </p>
            <p className="quote-footer-website">www.rysthdesign.com</p>
          </div>
        </div>
      </div>
    );
  },
);

QuotePrintTemplate.displayName = "QuotePrintTemplate";

export default QuotePrintTemplate;
