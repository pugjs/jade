# jade Collaborator Guide

**Contents**

* Issues and Pull Requests
* Accepting Modifications
 - Involving the TC
* Landing Pull Requests
 - Technical HOWTO

This document contains information for Collaborators of the jade
project regarding maintaining the code, documentation and issues.

Collaborators should be familiar with the guidelines for new
contributors in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Issues and Pull Requests

Courtesy should always be shown to individuals submitting issues and
pull requests to the jade project.

Collaborators should feel free to take full responsibility for
managing issues and pull requests they feel qualified to handle, as
long as this is done while being mindful of these guidelines and the
opinions of other Collaborators.

Collaborators may **close** any issue or pull request they believe is
not relevant for the future of the jade project. Where this is
unclear, the issue should be left open for several days to allow for
additional discussion. Where this does not yield input from jade
Collaborators or additional evidence that the issue has relevance, the
issue may be closed. Remember that issues can always be re-opened if
necessary.

## Accepting Modifications

All modifications to the jade code and documentation should be
performed via GitHub pull requests, including modifications by
Collaborators.

All pull requests must be reviewed and accepted by a Collaborator with
sufficient expertise who is able to take full responsibility for the
change. In the case of pull requests proposed by an existing
Collaborator, an additional Collaborator is required for sign-off.

In some cases, it may be necessary to summon a qualified Collaborator
to a pull request for review by @-mention.

If you are unsure about the modification and are not prepared to take
full responsibility for the change, defer to another Collaborator.

Before landing pull requests, sufficient time should be left for input
from other Collaborators. Leave at least 48 hours during the week and
72 hours over weekends to account for international time differences
and work schedules. Trivial changes (e.g. those which fix minor bugs
or improve performance without affecting API or causing other
wide-reaching impact) may be landed after a shorter delay.

Where there is no disagreement amongst Collaborators, a pull request
may be landed given appropriate review. Where there is discussion
amongst Collaborators, consensus should be sought if possible.

All bugfixes require a test case which demonstrates the defect. The
test should *fail* before the change, and *pass* after the change.

### Building documentation

For local builds run ```node docs/server.js```.

To update the live page, create a file with the name ```.release.json```,
[generate a GitHub token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
and put it into the file so that it be read with JSON.parse:

```
"abc123..."
```

Then run ```node release.js``` which will build it from the "docs" directory
and commit it to gh-pages automatically.

### Releasing

Open an issue with a proposed changelog and semver-compatible version number.

Once this has been approved by the Collaborators, run ```npm prepublish```,
update ```History.md``` with the new changelog, bump the version number in
```package.json``` as well as ```component.json``` and tag the new release.

Commit these changes and run ```npm publish```.

### I just made a mistake

With git, there's a way to override remote trees by force pushing
(`git push -f`). On master, this should be seen as forbidden (since
you're rewriting history on a repository other people are working
against) but is allowed for simpler slip-ups such as typos in commit
messages. However, you are only allowed to force push to any jade
branch within 10 minutes from your original push. If someone else
pushes to the branch your commit lives in or the 10 minute period
passes, consider the commit final.
