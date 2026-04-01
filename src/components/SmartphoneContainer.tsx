interface SmartphoneContainerProps {
  children: React.ReactNode;
  borderColor?: 'black' | 'white';
}

export function SmartphoneContainer({ children, borderColor = 'black' }: SmartphoneContainerProps) {
  const borderClass = borderColor === 'white' ? 'border-white' : 'border-black';
  
  return (
    <div className={`w-[393px] h-[852px] bg-background overflow-hidden border-2 ${borderClass} rounded-[2.5rem] shadow-xl relative`}>
      {children}
    </div>
  );
}