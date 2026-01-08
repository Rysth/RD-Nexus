import { forwardRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Invoice } from "@/stores/invoiceStore";
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

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  business: Business | null;
}

const InvoicePrintTemplate = forwardRef<
  HTMLDivElement,
  InvoicePrintTemplateProps
>(({ invoice, business }, ref) => {
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
          <h1 className="quote-title">COMPROBANTE DE SERVICIO</h1>
          <p className="quote-subtitle">{invoice.invoice_number}</p>
          <p
            style={{
              fontSize: "8px",
              color: "#6b7280",
              marginTop: "4px",
              fontStyle: "italic",
            }}
          >
            Documento informativo — No válido como comprobante tributario
          </p>
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
                <span className="quote-info-value quote-link">0988949117</span>
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
                  {formatDate(invoice.issue_date)}
                </span>
              </div>
              <div className="quote-info-item">
                <span className="quote-info-label">Documento #:</span>
                <span className="quote-info-value">
                  {invoice.invoice_number}
                </span>
              </div>
              <div className="quote-info-item">
                <span className="quote-info-label">Vence:</span>
                <span className="quote-info-value">
                  {formatDate(invoice.due_date)}
                </span>
              </div>
              {invoice.status === "paid" && invoice.payment_date && (
                <div className="quote-info-item">
                  <span className="quote-info-label">Pagada:</span>
                  <span
                    className="quote-info-value"
                    style={{ color: "#16a34a" }}
                  >
                    {formatDate(invoice.payment_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Section */}
      <div className="quote-section">
        <div className="quote-section-header">
          <span>Cobrar A</span>
        </div>
        <div className="quote-client-info">
          <div className="quote-client-row">
            <div className="quote-info-item">
              <span className="quote-info-label">Nombre:</span>
              <span className="quote-info-value">
                {invoice.client?.name || "N/A"}
              </span>
            </div>
            <div className="quote-info-item">
              <span className="quote-info-label">Negocio:</span>
              <span className="quote-info-value">
                {invoice.project?.name || invoice.client?.name || "N/A"}
              </span>
            </div>
          </div>
          <div className="quote-info-item">
            <span className="quote-info-label">Celular:</span>
            <span className="quote-info-value quote-link">
              {invoice.client?.phone || "N/A"}
            </span>
          </div>
          <div className="quote-info-item">
            <span className="quote-info-label">Email:</span>
            <span className="quote-info-value">
              {invoice.client?.email || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="quote-section">
        <div className="quote-section-header">
          <span>Detalle del Comprobante</span>
        </div>
        <table className="quote-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-desc">Descripción</th>
              <th className="col-qty">Cantidad</th>
              <th className="col-price">Precio</th>
              <th className="col-iva">IVA</th>
              <th className="col-subtotal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => {
              const itemIva = (item.subtotal * invoice.tax_rate) / 100;
              return (
                <tr key={item.id || index}>
                  <td className="col-num">{index + 1}</td>
                  <td className="col-desc">{item.description}</td>
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-price">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="col-iva">{formatCurrency(itemIva)}</td>
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
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div className="quote-total-row">
            <span className="quote-total-label">IVA ({invoice.tax_rate}%)</span>
            <span className="quote-total-value">
              {formatCurrency(invoice.tax_amount)}
            </span>
          </div>
          <div className="quote-total-row quote-total-final">
            <span className="quote-total-label">TOTAL</span>
            <span className="quote-total-value">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Status Badge */}
      {invoice.status === "paid" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            border: "4px solid #16a34a",
            color: "#16a34a",
            padding: "10px 40px",
            fontSize: "32px",
            fontWeight: "bold",
            textTransform: "uppercase",
            opacity: 0.3,
            pointerEvents: "none",
          }}
        >
          PAGADA
        </div>
      )}

      {invoice.status === "voided" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            border: "4px solid #dc2626",
            color: "#dc2626",
            padding: "10px 40px",
            fontSize: "32px",
            fontWeight: "bold",
            textTransform: "uppercase",
            opacity: 0.3,
            pointerEvents: "none",
          }}
        >
          ANULADA
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="quote-section">
          <div className="quote-section-header">
            <span>Notas</span>
          </div>
          <div className="quote-notes">
            <p>{invoice.notes}</p>
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
});

InvoicePrintTemplate.displayName = "InvoicePrintTemplate";

export default InvoicePrintTemplate;
