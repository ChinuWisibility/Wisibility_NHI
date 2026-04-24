import { Fragment, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title?:    string
  children:  ReactNode
  size?:     'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-bg-dark/80 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full bg-surface border border-surface-border rounded-lg shadow-2xl',
                  sizes[size],
                )}
              >
                {title && (
                  <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
                    <Dialog.Title className="font-display text-sm font-semibold text-[#e2eeff]">
                      {title}
                    </Dialog.Title>
                    <button onClick={onClose} className="text-[#5a7a9a] hover:text-[#e2eeff] transition-colors">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="p-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
