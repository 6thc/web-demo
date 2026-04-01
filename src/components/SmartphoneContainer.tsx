interface SmartphoneContainerProps {
  children: React.ReactNode;
  borderColor?: 'black' | 'white';
}

export function SmartphoneContainer({ children, borderColor = 'black' }: SmartphoneContainerProps) {
  const borderClass = borderColor === 'white' ? 'border-white' : 'border-black';
  
  return (
    <div className={`w-[393px] h-[852px] bg-background overflow-hidden border-[3px] ${borderClass} rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.05)] relative`}>
      {children}
    </div>
  );
}