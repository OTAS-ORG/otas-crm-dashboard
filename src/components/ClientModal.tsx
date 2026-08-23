import React, { useState } from "react";
import ClientDetailModal from "./ClientDetailModal";
import ClientFormModal from "./ClientFormModal";

export interface ClientModalProps {
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  clientId,
  isOpen,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  // If there's no clientId, we are creating a new client -> show Form Modal
  if (!clientId) {
    return (
      <ClientFormModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
      />
    );
  }

  // If user clicked edit from within the detail modal -> show Form Modal
  if (isEditing) {
    return (
      <ClientFormModal
        clientId={clientId}
        isOpen={isOpen}
        onClose={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          onSave();
        }}
      />
    );
  }

  // Otherwise, show the newly designed Client Detail Modal
  return (
    <ClientDetailModal
      clientId={clientId}
      isOpen={isOpen}
      onClose={onClose}
      onEdit={() => setIsEditing(true)}
      onSave={onSave}
    />
  );
};

export { ClientDetailModal, ClientFormModal };
export default ClientModal;
