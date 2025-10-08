export default function About() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">About Chef Fest</h2>
          <p className="text-lg text-muted-foreground">Revolutionizing home cooking with AI technology</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&h=600" 
              alt="Modern kitchen" 
              className="rounded-2xl shadow-lg" 
            />
          </div>
          <div>
            <h3 className="font-display font-bold text-2xl text-foreground mb-4">Our Mission</h3>
            <p className="text-foreground mb-4">
              Chef Fest empowers home cooks to create amazing dishes with the ingredients they already have. 
              Our AI-powered platform transforms your kitchen staples into culinary masterpieces.
            </p>
            <p className="text-foreground">
              Whether you're a beginner or experienced chef, Chef Fest makes cooking accessible, exciting, 
              and sustainable by reducing food waste and inspiring creativity.
            </p>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-brain text-3xl text-primary"></i>
            </div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-2">AI-Powered</h4>
            <p className="text-muted-foreground">Advanced AI generates personalized recipes tailored to your ingredients</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-image text-3xl text-secondary"></i>
            </div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-2">Visual Recognition</h4>
            <p className="text-muted-foreground">Upload food photos and instantly identify dishes with recipes</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bookmark text-3xl text-accent"></i>
            </div>
            <h4 className="font-display font-semibold text-lg text-foreground mb-2">Save & Share</h4>
            <p className="text-muted-foreground">Build your personal recipe collection and share with friends</p>
          </div>
        </div>
      </div>
    </section>
  );
}
