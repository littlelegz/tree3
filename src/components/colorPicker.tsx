import React from 'react';

interface ColorPickerProps {
  onChange: (color: { hex: string | null}) => void;
  onClose: () => void;
}

const BasicColorPicker: React.FC<ColorPickerProps> = ({ onChange, onClose }) => {
  const colors = [
    '#FF9999', '#99FF99', '#9999FF',  // Lighter red, green, blue
    '#FFFF99', '#FF99FF', '#99FFFF',  // Lighter yellow, magenta, cyan
    '#FFB366', '#B3FF66', '#66B3FF',  // Muted orange, lime, sky blue
    '#B366FF', '#66FFB3', "#FFFFFF"   // Soft pink, purple, mint
  ];

  return (
    <div
      style={{
        position: 'absolute',
        background: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '5px',
      }}
    >
      {colors.map((color, index) => (
        <button
          key={index}
          style={{
            width: '30px',
            height: '30px',
            background: color,
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (color === "#FFFFFF") {
              onChange({ hex: null });
            } else {
              onChange({ hex: color });
            }
          }}
        />
      ))}
    </div>
  );
};

export default BasicColorPicker;