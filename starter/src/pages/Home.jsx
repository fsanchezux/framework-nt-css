import { ArrowRight } from 'lucide-react'
import { Button, Page, Typewriter } from 'framework-nt-css'

export function Home({ navigate }) {
  return <Page className="pt-20 text-center lg:pt-28">
    <Typewriter lines={[{ text: '__TITLE__' }, { text: 'listo para empezar.', className: 'text-ink/45' }]}/>
    <div className="mt-10 flex justify-center">
      <Button size="lg" iconRight={ArrowRight} onClick={() => navigate('overview')}>Ver el resumen</Button>
    </div>
  </Page>
}
