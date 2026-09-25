import { Background } from "@/components/site/Background";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Truths } from "@/components/site/Truths";
import { Calculator, SectionTitle } from "@/components/calc/Calculator";

export default function Home() {
  return (
    <>
      <Background />
      {/* На десктопе справа живёт панель параметров: до 1440 px освобождаем под неё место */}
      <div className="lg:pr-[104px] min-[1440px]:pr-0">
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
      </div>
    </>
  );
}
