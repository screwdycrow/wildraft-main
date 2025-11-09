import Toast, { PluginOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const options: PluginOptions = {
  position: 'bottom-center',
  timeout: 2500, // Slightly shorter
  closeOnClick: true,
  pauseOnFocusLoss: false, // Don't pause when window loses focus
  pauseOnHover: true,
  draggable: false, // Less obtrusive without dragging
  showCloseButtonOnHover: false,
  hideProgressBar: true, // More discrete without progress bar
  closeButton: false, // No close button for cleaner look
  icon: true,
  rtl: false,
  maxToasts: 3, // Prevent spam by limiting to 3 toasts at once
  newestOnTop: false, // Keep order consistent
  transition: 'Vue-Toastification__fade', // Subtle fade transition
  toastClassName: 'custom-toast',
  containerClassName: 'custom-toast-container',
}

export default Toast
export { options }





