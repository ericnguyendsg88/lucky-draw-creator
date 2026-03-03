import { LuckyDraw } from "@/components/LuckyDraw";
import { DrawConfig } from "@/lib/drawConfig";

interface IndexProps {
  drawConfig: DrawConfig;
}

const Index = ({ drawConfig }: IndexProps) => {
  return <LuckyDraw drawConfig={drawConfig} />;
};

export default Index;
