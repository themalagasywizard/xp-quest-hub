
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPerkData } from "@/data/perks";
import { toast } from "sonner";

interface PerkNode extends d3.HierarchyNode<any> {
  x: number;
  y: number;
  data: {
    id: string;
    name: string;
    tier: string;
    effect: string;
    requirements: string;
    branch: string;
  };
}

interface PerkTreeProps {
  path: "strategist" | "explorer" | "creator";
}

export function PerkTree({ path }: PerkTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPerk, setSelectedPerk] = useState<PerkNode["data"] | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const data = getPerkData(path);
    if (!svgRef.current) return;

    // Clear existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create tree layout
    const treeLayout = d3.tree<any>().size([dimensions.height - 100, dimensions.width - 200]);

    // Create hierarchy
    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .append("g")
      .attr("transform", "translate(100,50)");

    // Add links
    svg.selectAll(".link")
      .data(treeData.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--border))")
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x)
      );

    // Add nodes
    const nodes = svg.selectAll(".node")
      .data(treeData.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Node circles with tier-based colors
    nodes.append("circle")
      .attr("r", 20)
      .attr("class", "transition-colors duration-200")
      .attr("fill", (d: PerkNode) => getTierColor(d.data.tier))
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 2)
      .on("click", (event: any, d: PerkNode) => {
        setSelectedPerk(d.data);
      });

    // Node labels
    nodes.append("text")
      .attr("dy", "0.31em")
      .attr("x", 25)
      .attr("text-anchor", "start")
      .text((d: PerkNode) => d.data.name)
      .attr("fill", "currentColor")
      .clone(true).lower()
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 3);

    // Zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on("zoom", (event) => {
        svg.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom as any);
  }, [path, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, container.clientHeight),
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <TooltipProvider>
      <div className="relative w-full aspect-[4/3] bg-background/50 rounded-lg border">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: "grab" }}
        />
        
        {/* Perk Details Dialog */}
        <Dialog open={!!selectedPerk} onOpenChange={() => setSelectedPerk(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedPerk?.name}</DialogTitle>
              <DialogDescription>
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold">Tier:</span> {selectedPerk?.tier}
                  </div>
                  <div>
                    <span className="font-semibold">Branch:</span> {selectedPerk?.branch}
                  </div>
                  <div>
                    <span className="font-semibold">Requirements:</span>
                    <p className="mt-1">{selectedPerk?.requirements}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Effect:</span>
                    <p className="mt-1">{selectedPerk?.effect}</p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast.info("This feature will be implemented soon!");
                      setSelectedPerk(null);
                    }}
                  >
                    Unlock Perk
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function getTierColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'basic':
      return 'hsl(142.1 76.2% 36.3%)'; // Green
    case 'intermediate':
      return 'hsl(47.9 95.8% 53.1%)'; // Yellow
    case 'advanced':
      return 'hsl(20.5 90.2% 48.2%)'; // Orange
    case 'expert':
      return 'hsl(0 84.2% 60.2%)'; // Red
    case 'ultimate':
      return 'hsl(272.9 73.5% 59.8%)'; // Purple
    default:
      return 'hsl(215 20.2% 65.1%)'; // Gray
  }
}
