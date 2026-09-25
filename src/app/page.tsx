import { Background } from "@/components/site/Background";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Truths } from "@/components/site/Truths";
import { Calculator, SectionTitle } from "@/components/calc/Calculator";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <Hero />
        <Calculator />
        <section className="mx-auto mt-16 max-w-[1320px] px-4 sm:px-6">
          <SectionTitle
            eyebrow="Без маркетинга"
            title="Что важно знать до решения"
            text="Цифры — только половина правды. Вот что меняет выбор сильнее, чем пара процентов."
          />
          <Truths />
        </section>
      </main>
      <Footer />
    </>
  );
}
