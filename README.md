# Anglo Piano

Anglo Piano is a learning and composition tool for Anglo concertina players. This repo is a vanilla JS re-implementation of the first [anglo piano](https://anglopiano.com), which was built in Axure RP. Definitely not ready for prime time yet. See current progress [here](https://lshillman.github.io/anglo-piano/).

As of Nov. 20, 2022, I've just implemented a feature to parse layout strings generated by the current "production" version of Anglo Piano (the part of custom layout URLs after `#layout=` ). For example, this is a 38-key Jeffries layout:
````
_30_eFHhJKNMmn.._160_QPPQsSVtWv......_15_cGGIijkLMNnh_80_rNoOqpSRuTwURq..IHjlMNOopqrs_110_poSrUTvuYw1x...._145_Kk_125_ii_220_xX
````
To load it, just drop it into the url preceded by a question mark, [like so](https://github.com/lshillman/anglo-piano/?_30_eFHhJKNMmn.._160_QPPQsSVtWv......_15_cGGIijkLMNnh_80_rNoOqpSRuTwURq..IHjlMNOopqrs_110_poSrUTvuYw1x...._145_Kk_125_ii_220_xX). _This is a temporary band-aid to allow you to use the tool while I work on improving the UX._

## Features, bugs, etc.

If you have an idea for a feature or think you've found a bug, post a message to [this thread](https://www.concertina.net/forums/index.php?/topic/24636-anglo-piano-webapp/) or message me directly on that forum.

## License

The eventual plan is for this to be open-source-ish (exact details TBD), but for now, talk to me if you want to use this.
