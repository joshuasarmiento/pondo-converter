<script setup lang="ts">
import { ShieldCheck, Info, HelpCircle } from 'lucide-vue-next';
</script>

<template>
  <div class="max-w-3xl mx-auto py-8 px-4 text-slate-800 font-sans">
    <div class="mb-8 text-center md:text-left">
      <h1 class="text-3xl font-black text-blue-900 tracking-tight">About Pondo Converter</h1>
      <p class="text-slate-600 mt-2 text-sm md:text-base leading-relaxed">
        A civic tech tool designed to translate government budgets and contract allocations into physical,
        everyday items that are easy to understand for the ordinary Filipino.
      </p>
    </div>

    <!-- Direct Summary Card -->
    <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-slate-900">
      <h2 class="text-base font-bold text-blue-950 flex items-center gap-2 mb-2">
        <Info class="w-5 h-5 text-blue-900 shrink-0" />
        Where does the budget go?
      </h2>
      <p class="text-xs md:text-sm leading-relaxed">
        Kapag may naririnig tayong bilyun-bilyong pisong budget para sa mga government projects, madalas mahirap
        ma-visualize kung gaano talaga ito kalaki.
        Ang goal ng tool na ito ay ipakita ang <strong>opportunity cost</strong> — basically, kung ginamit ang pondo sa
        ibang paraan, gaano karaming sacks of rice, classrooms, textbooks, o days of minimum wage ang katumbas nito?
      </p>
    </div>

    <!-- How it works (Direct bullet points) -->
    <div class="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
      <h3 class="font-bold text-slate-900 text-sm md:text-base mb-4 flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-blue-900" />
        Saan galing ang data?
      </h3>
      <div class="space-y-4 text-xs md:text-sm text-slate-700">
        <div class="flex gap-3">
          <span class="w-2 h-2 rounded-full bg-blue-900 shrink-0 mt-1.5"></span>
          <p>
            <strong>Government Contracts:</strong> Straight from the official <strong>PhilGEPS Open Data
              Portal</strong>. Sinala natin ang top contracts na may malalaking halaga para makita ang direct impact
            nito kapag isinalin sa mga pampublikong bilihin at serbisyo.
          </p>
        </div>
        <div class="flex gap-3">
          <span class="w-2 h-2 rounded-full bg-blue-900 shrink-0 mt-1.5"></span>
          <p>
            <strong>Market Prices of Goods:</strong> Ang presyo ng basic items tulad ng rice, canned sardines, at
            instant noodles ay regular na ina-update base sa price bulletins ng <strong>Department of Agriculture (DA)
              Bantay Presyo</strong> at <strong>DTI Suggested Retail Price (SRP)</strong>.
          </p>
        </div>
        <div class="flex gap-3">
          <span class="w-2 h-2 rounded-full bg-blue-900 shrink-0 mt-1.5"></span>
          <p>
            <strong>Wages, Classrooms, & Healthcare:</strong> Ang NCR Minimum Wage is set to <strong>₱610/day</strong>.
            Ang pampublikong silid-aralan naman ay estimated sa <strong>₱2.5 Million each</strong> (based on DepEd
            standards), textbooks are set to <strong>₱150 each</strong>, at ang PhilHealth contribution is pegged at
            <strong>₱500/month</strong>.
          </p>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="border-t border-slate-200 pt-8 mb-8">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <HelpCircle class="w-5 h-5 text-blue-900" />
        Frequently Asked Questions (FAQ)
      </h3>

      <div class="space-y-4 text-xs md:text-sm">
        <div>
          <h4 class="font-bold text-slate-900">Who made this tool?</h4>
          <p class="text-slate-600 mt-0.5">
            Ito ay isang independent civic tech project created for public education and budget transparency.
          </p>
        </div>

        <div>
          <h4 class="font-bold text-slate-900">Is this affiliated with any government agency?</h4>
          <p class="text-slate-600 mt-0.5">
            No. This is not an official tool and has no affiliation with COA, PhilGEPS, DA, or any other government
            office in the Philippines.
          </p>
        </div>

        <div>
          <h4 class="font-bold text-slate-900">What do "Flagged" and "Awarded" statuses mean?</h4>
          <p class="text-slate-600 mt-0.5">
            <strong>Awarded</strong> means na-approve at naibigay na ang contract sa winning contractor.
            <strong>Flagged</strong> contracts are those highlighted in official audit reports (like COA) or news
            reports due to pricing issues or procedural irregularities.
          </p>
        </div>
      </div>
    </div>

    <!-- Clean Disclaimer Banner -->
    <div
      class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-[11px] md:text-xs text-amber-950 leading-relaxed">
      <span class="font-bold uppercase tracking-wider block text-amber-900 mb-1">Disclaimer</span>
      This platform is for educational and analytical purposes only. All calculations and equivalents are estimates
      based on public price baselines and do not represent a final financial audit of any government project.
    </div>
  </div>
</template>
