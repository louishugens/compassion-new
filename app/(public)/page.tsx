import Link from "next/link"
import { ExternalLink } from "lucide-react"

const centers = [
  { id: "HA152", name: "Centre HA152" },
  { id: "HA202", name: "Centre HA202" },
  { id: "HA313", name: "Centre HA313" },
  { id: "HA314", name: "Centre HA314" },
  { id: "HA353", name: "Centre HA353" },
  { id: "HA726", name: "Centre HA726" },
  { id: "HA727", name: "Centre HA727" },
  { id: "HA748", name: "Centre HA748" },
  { id: "HA802", name: "Centre HA802" },
  { id: "HA805", name: "Centre HA805" },
  { id: "HA829", name: "Centre HA829" },
  { id: "HA833", name: "Centre HA833" },
  { id: "HA835", name: "Centre HA835" },
  { id: "HA916", name: "Centre HA916" },
  { id: "HA937", name: "Centre HA937" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header/Navigation */}


      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
              Compassion Haiti
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">Plateforme Compassion Haïti</p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Partenariat avec Compassion International pour libérer les enfants de la pauvreté au nom de Jésus. Explorez nos
              Centres de Développement d'Enfants à travers Haïti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#centers"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-800 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Explorer les centres
              </a>
              <a
                href="https://www.facebook.com/compassion.caribbean/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-blue-800 text-blue-800 font-medium hover:bg-blue-800/5 transition-colors"
              >
                Suivre sur Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 md:px-8 bg-blue-300/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-800 mb-2">15</div>
              <p className="text-sm text-muted-foreground">Centres de Développement d'Enfants</p>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-800 mb-2">100+</div>
              <p className="text-sm text-muted-foreground">Enfants servis</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-3xl md:text-4xl font-bold text-blue-800 mb-2">1</div>
              <p className="text-sm text-muted-foreground">Mission : Libérer les enfants de la pauvreté</p>
            </div>
          </div>
        </div>
      </section>

      {/* Centers Section */}
      <section id="centers" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Nos centres</h2>
            <p className="text-lg text-muted-foreground">
              Connectez-vous avec nos Centres de Développement d'Enfants sur Facebook pour rester informé des activités et de l'impact.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {centers.map((center) => (
              <a
                key={center.id}
                href={`https://www.facebook.com/search/top?q=${center.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-6 rounded-xl bg-card border border-border hover:border-blue-800 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-800/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-blue-800" />
                      </div>
                      <span className="font-semibold text-foreground">{center.id}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-800 transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {center.name}
                  </p>
                  <div className="mt-4 h-1 w-0 bg-blue-800 group-hover:w-full transition-all duration-300" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-blue-300/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Faire une différence</h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Rejoignez Compassion International pour libérer les enfants de la pauvreté. Soutenez nos Centres de Développement d'Enfants et
            transformez des vies grâce à l'éducation, aux soins de santé et à l'accompagnement spirituel.
          </p>
          <a
            href="https://www.compassion.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-800 text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-lg"
          >
            En savoir plus sur le parrainage <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </section>


    </main>
  )
}
