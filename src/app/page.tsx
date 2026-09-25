import { Background } from "@/components/site/Background";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Truths } from "@/components/site/Truths";
import { Calculator, SectionTitle } from "@/components/calc/Calculator";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <Calculator />
        <section className="mx-auto mt-28 max-w-[1240px] px-4 sm:px-8">
          <SectionTitle
            eyebrow="Без маркетинга"
            title="Что важно знать до решения"
            text="Цифры — только половина правды. Вот что меняет выбор сильнее, чем пара процентов."
          />
          <Truths />
        </section>
      </main>
      <Footer />
      {/* Место под плавающую панель параметров, чтобы она не закрывала подвал */}
      <div aria-hidden className="h-36 sm:h-24" />
    </>
  );
}
