"use client"; 
import React from "react"; 

export default function Modal({ onClose, children }: { onClose: () => void, children: React.ReactNode }) {                                 
      return (                                                                                                                               
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>                                
              <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>                  
                  {children}                                                                                                                 
              </div>                                                                                                                       
          </div>                                                                                                                             
      );                                                                                                                                   
  }