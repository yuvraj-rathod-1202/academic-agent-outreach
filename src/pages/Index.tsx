import ProfessorConnect from "@/components/ProfessorConnect";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">AI-Powered Professor Connect</h1>
          <p className="text-xl text-muted-foreground">Find the perfect professor for your research collaboration</p>
        </div>
        <ProfessorConnect />
      </div>
    </div>
  );
};

export default Index;
