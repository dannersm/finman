import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Common utility functions to reduce code duplication

// Currency formatting
export const formatCurrency = (amount) => 
  new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(amount);

// Helper to safely parse date strings or Date objects
const toDate = (date) => {
  if (typeof date === 'string') {
    // Fix for timezone issues: treat ISO dates as local dates by ignoring time components
    // This ensures that 2023-10-27T00:00:00Z is displayed as 27/10 regardless of local timezone
    if (date.indexOf('T') > -1) {
      return parseISO(date.split('T')[0]);
    }
    return parseISO(date);
  }
  return date;
};

// Date formatting
export const formatDate = (date) => format(toDate(date), 'yyyy-MM-dd');

// Short date formatting for tables (dd/mm)
export const formatShortDate = (date) => format(toDate(date), 'dd/MM');

// Format date string to MM/YY
export const formatMonthYear = (date) => format(toDate(date), 'MM/yy');

// Responsive size helper
export const getResponsiveSize = (isMobile, mobileSize = "small", desktopSize = "medium") => 
  isMobile ? mobileSize : desktopSize;

// Common responsive typography variants
export const getResponsiveVariant = (isMobile, mobileVariant = "subtitle1", desktopVariant = "h6") => 
  isMobile ? mobileVariant : desktopVariant;

// Truncate text for mobile
export const truncateText = (text, maxLength = 12) => 
  text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

// Common chart margins
export const getChartMargins = (isMobile) => ({
  top: 5,
  right: isMobile ? 10 : 30,
  left: isMobile ? 10 : 20,
  bottom: 5
});