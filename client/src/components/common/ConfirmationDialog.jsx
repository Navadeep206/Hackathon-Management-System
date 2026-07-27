import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Modal from './Modal';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This operation cannot be reversed.',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  type = 'danger',
}) => {
  const confirmBtnBg =
    type === 'danger'
      ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-150'
      : 'bg-indigo-650 hover:bg-indigo-700 shadow-sm shadow-indigo-150';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div
            className={`p-3 rounded-full flex-shrink-0 ${
              type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            <FaExclamationTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 leading-relaxed mt-1">
            {message}
          </p>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl cursor-pointer transition-all ${confirmBtnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
