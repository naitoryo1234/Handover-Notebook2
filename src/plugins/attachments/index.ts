/**
 * Attachments Plugin
 * 
 * Allows adding images to existing clinical records.
 * 
 * Usage:
 * 1. Set ATTACHMENTS_ENABLED=true in .env
 * 2. Import components from this module
 * 3. Use feature flag check before rendering
 * 
 * @example
 * import { features } from '@/config/features';
 * import { AttachmentButton, AttachmentModal, AttachmentGallery } from '@/plugins/attachments';
 * 
 * {features.plugins.attachments.enabled && <AttachmentButton onClick={...} />}
 */

export { AttachmentButton } from './AttachmentButton';
export { AttachmentModal } from './AttachmentModal';
export { AttachmentGallery } from './AttachmentGallery';
export { uploadAttachmentAction, deleteAttachmentAction, getAttachmentsForRecord } from './attachmentActions';
