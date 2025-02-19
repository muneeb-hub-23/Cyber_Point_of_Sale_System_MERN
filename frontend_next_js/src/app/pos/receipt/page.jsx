'use client';
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const Receipt = ((props, ref) => (
  <div ref={ref} style={{ padding: '20px', maxWidth: '300px', fontFamily: 'Arial, sans-serif' }}>
    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Store Receipt</h2>

    {/* Store Information */}
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <p>Store Name</p>
      <p>123 Main St.</p>
      <p>City, State, ZIP</p>
      <p>(555) 555-5555</p>
    </div>

    {/* Items List */}
    <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Item</th>
          <th style={{ textAlign: 'right' }}>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Item 1</td>
          <td style={{ textAlign: 'right' }}>$10.00</td>
        </tr>
        <tr>
          <td>Item 2</td>
          <td style={{ textAlign: 'right' }}>$5.00</td>
        </tr>
        <tr>
          <td>Item 3</td>
          <td style={{ textAlign: 'right' }}>$7.50</td>
        </tr>
      </tbody>
    </table>

    {/* Subtotal, Tax, and Total */}
    <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal:</span>
        <span>$22.50</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tax (5%):</span>
        <span>$1.13</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Total:</span>
        <span>$23.63</span>
      </div>
    </div>

    {/* Footer */}
    <p style={{ textAlign: 'center', marginTop: '20px' }}>Thank you for your purchase!</p>
  </div>
));

const ReceiptPage = () => {
  const contentRef = useRef();
  const reactToPrintFn = useReactToPrint({
    contentRef
  });

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={reactToPrintFn} style={{ padding: '10px 20px', marginBottom: '20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
        Print Receipt
      </button>
      <Receipt ref={contentRef} />
    </div>
  );
};

export default ReceiptPage;
