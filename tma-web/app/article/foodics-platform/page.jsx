import Link from "next/link";
import { CaseNav, CaseFooter } from "@/components/case/CaseLayout";
import {
  ArticleHero,
  ArticleBody,
  ArticleCallout,
  ArticleStats,
  ArticleSignoff,
  ArticleRelated,
} from "@/components/article/ArticleLayout";
import ClientShell from "@/components/shell/ClientShell";

export const metadata = {
  title: "From POS to platform: lessons from Foodics' unicorn arc",
  description:
    "When a product outgrows its category, the most expensive thing you can do is stay in it. How repositioning — not feature releases — turned a regional POS company into the operating system of F&B in the GCC.",
};

export default function ArticleFoodicsPlatform() {
  return (
    <>
      <ClientShell enableScrolledNav={false} />
      <div className="case-page">
        <CaseNav />

        <ArticleHero
          tag="Brand"
          date="Mar 2026"
          readTime="12 min"
          title={<>From POS to <span className="ital">platform.</span> Lessons from Foodics' unicorn arc.</>}
          deck="When a product outgrows its category, the most expensive thing you can do is stay in it. Here's how repositioning — not feature releases — turned a regional POS company into the operating system of F&B in the GCC."
        />

        <ArticleBody>
          <p className="lead">
            Most companies die in the category they were born in. Not because the product stops working — but because the market keeps describing it with a sentence that no longer matches what it does. The story freezes. The product keeps shipping. And one day the gap between what you sell and what people think you sell becomes the ceiling on your valuation.
          </p>
          <p>
            Foodics was running into exactly that ceiling. By 2022, the product had quietly become an operating system for restaurants across the GCC — POS, payments, capital, supply, data, marketplace. But the market still called it "the iPad cashier." Buyers were paying for one feature inside a stack worth ten times more.
          </p>
          <p>
            The work we did with Foodics over the next two years — across brand, stage, GTM and content — wasn't a campaign. It was a re-categorization. And the lessons travel to any company that has outgrown its origin story.
          </p>

          <h2>Lesson one: the product is ahead of the story.</h2>
          <p>
            Every platform company hits the moment where the roadmap has already built the future, but the brand is still selling the past. The symptoms are easy to spot: sales decks have a "now also includes..." slide; the homepage navigation has nine top-level items; the founder starts every external talk by re-explaining what the company actually does.
          </p>
          <p>
            That's not a marketing problem. That's a strategy problem dressed up as a marketing problem. The fix isn't louder messaging. It's deciding what category you actually compete in now — and committing to that category with the same discipline you committed to the original one.
          </p>

          <ArticleCallout kicker="The diagnostic">
            If your founder spends the first 90 seconds of every keynote
            <span className="ital"> re-defining</span> what the company does, your
            brand is <span className="ital">a year behind</span> your product.
          </ArticleCallout>

          <h2>Lesson two: pick a noun, not a list.</h2>
          <p>
            The temptation, when a company has expanded into adjacent products, is to describe the new shape with a list: "We do POS, plus payments, plus capital, plus marketplace…" That's how you sound on an earnings call. It's not how you sound on a buyer's whiteboard.
          </p>
          <p>
            The work with Foodics centered on replacing the list with a single noun: <strong>growth platform</strong>. Every product became a lever merchants pull to grow — not a SKU on a price sheet. Pay was how merchants got paid faster. Capital was how they expanded faster. Marketplace was how they reached more guests. The narrative collapsed a five-product story into a one-word category.
          </p>
          <p>
            That single word changed the buying conversation. Sales stopped competing feature-by-feature against incumbent POS providers and started competing platform-vs-tool — a category in which the incumbents had nothing to say.
          </p>

          <h2>Lesson three: stage the moment.</h2>
          <p>
            A repositioning that lives only in a deck is a repositioning that didn't happen. The market doesn't read your slides. It watches what you do in public.
          </p>
          <p>
            Boundless — the flagship event we built with Foodics across two consecutive years — was the load-bearing moment of the new category. Two thousand merchants in the room. Regulators. Investors. Press. A stage designed to make the new story unmissable. Three product unveils tied into a single thirty-minute on-stage narrative. A ninety-day rollout that translated the moment into pipeline.
          </p>

          <ArticleStats
            items={[
              { v: "+35.6%", l: "YoY revenue '24" },
              { v: "35%", l: "KSA market share" },
              { v: "$1B", l: "Series-C valuation" },
            ]}
          />

          <p>
            The stage was the artifact that made the new positioning real — to merchants, to partners, to capital markets. After Boundless '23, the conversation about Foodics was no longer "they make a POS." It was "they run the platform F&amp;B is being built on."
          </p>

          <blockquote>
            A platform is not a feature set. It's a position other companies decide to build on top of you.
            <footer>— field note, TMA brand</footer>
          </blockquote>

          <h2>Lesson four: hold the line.</h2>
          <p>
            The hardest part of a repositioning isn't the launch. It's the twelve months after, when every internal stakeholder lobbies to add their feature, their region, their vertical back into the headline. The product team wants to talk about the new module. The sales team wants vertical-specific decks. The regional team wants country-by-country messaging.
          </p>
          <p>
            A category narrative survives only if leadership protects it from internal entropy. Every new product launch, every new market entry, every new piece of content has to be measured against a single question: <em>does this make the category clearer, or does it muddy it?</em>
          </p>

          <h2>What to take away.</h2>
          <p>
            Whether you're a SaaS company, a fintech, a commerce platform or a public-sector tech operator, the pattern is the same: the market will describe you with the simplest sentence it can find. If you don't choose the sentence, the sentence chooses you — and it's almost always a downgrade of what you actually do.
          </p>
          <p>Three questions for any leadership team that thinks they've outgrown their category:</p>
          <ul>
            <li>If we replaced our entire homepage with a single noun, what would it be?</li>
            <li>What do we lose by saying it that way? What do we gain?</li>
            <li>Where, on what stage, in front of which room — are we going to put that noun in public, irrevocably, this year?</li>
          </ul>
          <p>
            A platform doesn't get built by feature releases. It gets built by a market that has agreed, collectively, to describe you as one. Your job is to give them the sentence — and then put it on stage so loudly they can't unhear it.
          </p>

          <ArticleSignoff>
            <p>This piece is part of TMA's ongoing field notes on brand strategy and category positioning across the GCC.</p>
            <p>
              Read the full case study on <Link href="/case/foodics-boundless">Foodics — Boundless</Link>, or <Link href="/#contact">talk to us</Link> about your own repositioning.
            </p>
          </ArticleSignoff>
        </ArticleBody>

        <ArticleRelated
          items={[
            { tag: "GTM", date: "Apr 2026", title: "Why B2B brands in the GCC win on brand, not on bid.", read: "8 min", href: "/article/gtm-brand-not-bid" },
            { tag: "Events", date: "Feb 2026", title: "How to turn a product launch into a category-defining moment.", read: "6 min", href: "/article/launch-as-category" },
          ]}
        />

        <CaseFooter />
      </div>
    </>
  );
}
