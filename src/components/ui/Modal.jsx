import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment } from 'react';
import Button from './Button.jsx';

export default function Modal({ open, title, description, children, onClose }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-3" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="glass w-full max-w-3xl rounded-3xl p-5 text-slate-950 dark:text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-2xl font-bold">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</Dialog.Description> : null}
                  </div>
                  <Button variant="ghost" className="h-10 w-10 px-0" onClick={onClose}>
                    <X size={18} />
                  </Button>
                </div>
                <div className="mt-5">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
