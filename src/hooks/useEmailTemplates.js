import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase/config';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { DEFAULT_EMAIL_TEMPLATES } from '../utils/defaultEmailTemplates';

const TEMPLATES_COLLECTION = 'emailTemplates';
const EMAIL_TYPES = [
  'passwordReset',
  'welcome',
  'orderConfirmation',
  'orderStatus',
  'orderPending',
  'orderProcessing',
  'orderShipped',
  'orderCompleted',
  'orderCancelled',
  'orderReturned',
  'paymentSuccess',
  'paymentFailure',
  'newsletter'
];

const useEmailTemplates = () => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all email templates from Firestore
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const templatesData = {};
      
      // Try to get from Firestore first
      for (const templateType of EMAIL_TYPES) {
        try {
          const docRef = doc(db, TEMPLATES_COLLECTION, templateType);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            templatesData[templateType] = docSnap.data();
          } else {
            // Use default template if not found in Firestore
            templatesData[templateType] = {
              ...DEFAULT_EMAIL_TEMPLATES[templateType],
              isCustom: false,
              updatedAt: new Date().toISOString()
            };
          }
        } catch (err) {
          console.error(`Error fetching ${templateType}:`, err);
          templatesData[templateType] = {
            ...DEFAULT_EMAIL_TEMPLATES[templateType],
            isCustom: false,
            updatedAt: new Date().toISOString()
          };
        }
      }

      setTemplates(templatesData);
    } catch (err) {
      console.error('Error fetching email templates:', err);
      setError(err.message);
      // Set default templates as fallback
      const defaultTemplates = {};
      EMAIL_TYPES.forEach(type => {
        defaultTemplates[type] = {
          ...DEFAULT_EMAIL_TEMPLATES[type],
          isCustom: false,
          updatedAt: new Date().toISOString()
        };
      });
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single template by type
  const getTemplate = useCallback(async (templateType) => {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateType);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return DEFAULT_EMAIL_TEMPLATES[templateType] || null;
    } catch (err) {
      console.error(`Error fetching ${templateType}:`, err);
      return DEFAULT_EMAIL_TEMPLATES[templateType] || null;
    }
  }, []);

  // Update template in Firestore
  const updateTemplate = useCallback(async (templateType, templateData) => {
    try {
      setError(null);

      const docRef = doc(db, TEMPLATES_COLLECTION, templateType);
      const dataToSave = {
        ...templateData,
        isCustom: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, dataToSave, { merge: true });

      // Update local state
      setTemplates(prev => ({
        ...prev,
        [templateType]: dataToSave
      }));

      return true;
    } catch (err) {
      console.error(`Error updating ${templateType}:`, err);
      setError(err.message);
      return false;
    }
  }, []);

  // Reset template to default
  const resetTemplate = useCallback(async (templateType) => {
    try {
      const defaultTemplate = DEFAULT_EMAIL_TEMPLATES[templateType];
      return await updateTemplate(templateType, defaultTemplate);
    } catch (err) {
      console.error(`Error resetting ${templateType}:`, err);
      setError(err.message);
      return false;
    }
  }, [updateTemplate]);

  // Get default template for a type
  const getDefaultTemplate = useCallback((templateType) => {
    return DEFAULT_EMAIL_TEMPLATES[templateType] || null;
  }, []);

  // Initialize templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    updateTemplate,
    resetTemplate,
    getDefaultTemplate,
    emailTypes: EMAIL_TYPES
  };
};

export default useEmailTemplates;
