# Process for changing the Ion Schema Specification

This document describes the process to evolve the Ion Schema Language. It only applies to the Ion Schema Language itself; feature proposals for each of the Ion Schema libraries and related projects are out of scope.

Without Ion Schema specification versions, almost any functional change to the Ion Schema specification is a potentially breaking change for Ion Schema users. When new features are added to the Ion Schema specification, prior releases of Ion Schema implementations will not have support for those features, causing a schema document to be interpreted differently depending on what version of an Ion Schema library is being used. To ensure that a schema document has consistent behavior across all releases of all implementations, new features are grouped into new versions of the Ion Schema specification. (For more details about Ion Schema versions, see [ISL Versioning](https://amazon-ion.github.io/ion-schema/docs/isl-versioning).)

## Ion Schema Language Evolution Goals

The following are the goals that inform the rest of this document.

* The design work for Ion Schema should be open source.
* The process should be lightweight and should not be an encumbrance to evolving Ion Schema.
* Don’t let perfect be the enemy of good—the most important part of vetting a proposed change is ensuring that it is *not bad*.
* The design of Ion Schema should be *community-driven*. That means that if community members would like to contribute a feature that fits with the stated design guidelines of Ion Schema, the default response should be to accept it unless there is a critical and well documented reason not to.

## Ion Schema Design Guidelines

Loosely based on the [original ISL 1.0 rationale](https://amazon-ion.github.io/ion-schema/docs/isl-1-0/spec#rationale), they are:

* Follow the principle of least surprise
* Have a minimal set of orthogonal constraints
* Constraints must be subtractive—if you add a constraint to a type, the valid values for the new type must be equal to or subset of the valid values for the original type. (In other words, for every type `t` and every constraint `c`, it MUST hold that for every Ion value `x`, if `x` is valid for `t ∪ c`, then it is also valid for `t`.)
* ISL only constrains the Ion *data model*. (Be careful not to confuse the encoding of a value with the value itself, but it is acceptable to test whether a value *could* be encoded a particular way. E.g. `uft8_byte_length` and `ieee754_float`.)
* ISL should be safe—it should be safe to use Ion Schema libraries with schemas and/or data from untrusted sources. (One implication, for example, is Ion Schema features should not permit arbitrary code execution or create any unmitigable attack vectors.)

## Roles

The following are key actors in the process for evolving the Ion Schema Language. A person may have more than one role.

* **Contributor:** a person who contributes code, ideas, documentation, or anything else to Ion Schema.
* **Maintainer**: a contributor who is a member of the group that has final decision-making authority for matters of design and implementation of Ion Schema and is responsible for the ongoing development of Ion Schema. For now, this is the Ion Team.
* **Feature Requestor**: a contributor who requests a feature. Usually “the feature requestor” used in reference to a specific feature.

# The Process

## Summary

* A **feature requestor** submits an issue suggesting an idea or describing a problem.
* Ion Schema **maintainers** informally decide whether it is a good idea (and explain, with adequate justification, why or why not the idea should be included).
* The **feature requestor** or another **contributor** formalizes the details of the feature in an RFC.
* The **maintainers** announce a public comment period. (The public has been able to see and comment on the PR this whole time, but this step is an official, time-bounded, public comment period intended to bring closure to the proposal.)
* If accepted, the **maintainers** will merge the RFC PR.
* Finally, the feature will be adopted by an Ion Schema Version RFC.

The process is intended to be iterative, so it is always possible to go to a prior step instead of rejecting a proposal outright.

## 1. Open an issue on the `ion-schema` GitHub repository

*The purpose of this step is to decide whether a proposal is, in principle, a good idea for Ion Schema.*

In the issue description, provide a high-level description of the feature you would like to add to the Ion Schema specification. Describe your use cases, and explain why the current version of Ion Schema fails to address them. List any alternative solutions you may have considered and the reasons that they were dismissed.

*DO NOT INCLUDE ANY PROPRIETARY INFORMATION IN YOUR REQUEST.*

This GitHub issue will allow the **maintainers** to discuss the proposal and decide whether they would like to see a more detailed RFC. Keep in mind that a feature’s soundness is not the only facet of the proposal that will be weighed. Any new feature could require:

* Adding support for the new feature in multiple [Ion Schema libraries](https://amzn.github.io/ion-schema/libs.html).
* Adding comprehensive example data to the centralized test repository, [`ion-schema-tests`.](https://github.com/amzn/ion-schema-tests)
* Planning an upgrade path for customers’ existing data.

If a change is backwards compatible, it may be included in a new *minor* version of the specification. Any changes that are not backwards compatible must be released in a new *major* version of the specification. To learn more about what kinds of changes can be released in a minor version bump, please review the document [*Ion Schema Language Versioning*](https://amazon-ion.github.io/ion-schema/docs/isl-versioning).

Following discussion, the Ion Schema **maintainers** will either close the issue or leave it open pending a full specification.
The **requestor** and/or the **maintainers** may write the specification for the feature, but neither are required to do so; the specification may be written by any **contributor**.

## 2. Write a specification for the feature

*The purpose of this step is to formalize a proposal and specify the exact details.*

*Ion Schema Feature RFCs* are documents which provide a comprehensive description of a proposed enhancement to the Ion Schema Language syntax or semantics. There is no minimum or maximum length—the length will probably be proportional to the complexity of the proposed change. The RFC should contain both prose and technical descriptions (sample implementation, grammar, and/or test cases) of the feature in sufficient detail that someone other than the author could implement the feature.

Create a Markdown file (`.md`) that describes the feature you would like Ion Schema to support. Consider including the following sections:

* **Summary:** Write a few sentences explaining the proposed feature at a high level. This should focus on the *what* and *why,* not the *how* of the change.
* **Motivation:** Describe the limitations of the incumbent Ion Schema version you hope to modify. Give examples of data and/or use cases that can lead to problems with processor performance, fidelity, or expressiveness.
* **Proposal:** Provide a thorough walk-through of the feature you propose. Using examples, demonstrate the benefits it offers in applicable situations.
* **Alternatives considered:** This section is an opportunity to head off discussions about ideas that you have already considered and dismissed for one reason or another. Questions to consider addressing include:
  * What are some ways to achieve the same thing using features that are already available in the current version of Ion Schema?
  * Could the functionality you need be provided using application-defined open content in Ion Schema? (For example, a ISL based code generator does not need a `javadoc` field added to the spec when an open content field called `_javadoc` would suffice.)
  * Did you tinker with different syntax and semantics for your feature before ultimately going with your current proposal? List them here and explain why they were less optimal.

For examples, please see the feature RFCs for Ion Schema [*Open Content*](https://github.com/amazon-ion/ion-schema/blob/208165adb10c889949252e7ccd926862bfe60019/rfcs/ion_schema_2_0/open_content.md) or Ion 1.1 *[Templates](https://github.com/amzn/ion-docs/blob/bf33a708d806e46bc24e6bad4a95c12fa359bac8/rfcs/ion_1_1/feature-templates.md#rfc-ion-templates)* and *[Inlineable Symbols](https://github.com/amzn/ion-docs/blob/bf33a708d806e46bc24e6bad4a95c12fa359bac8/rfcs/ion_1_1/ion_1_1.md#inline-symbols).*
For examples of shorter RFCs [Add Constraints for Smaller IEEE-754 Binary Types · Issue #18 · amazon...](https://github.com/amazon-ion/ion-schema/issues/18#issuecomment-1092130146) and [*Allow field names to be constrained without exact field names being sp...*](https://github.com/amazon-ion/ion-schema/issues/44#issuecomment-1097296761). (Note that these were created prior to the requirement for RFCs to be a markdown document, but in terms of content, they are examples of an RFC.)

#### Open a feature PR

When the document is ready, open a PR that adds your `.md` file to the folder `rfcs/`. In the PR description, include:

1. A link to the original issue from step 1.
2. A link directing users to a rendered version of the `.md` content.

The Ion **maintainers** will add a link to your proposal to [the Ion home page](https://amzn.github.io/ion-docs/) and to [the Ion news page](https://amzn.github.io/ion-docs/news.html). Members of the Ion community at large will be able to comment on the proposal.

Discussion of the RFC involves two phases. The first phase is not time-bound, and is intended to allow thorough evaluation of the technical details of the proposal, including its impact on the broader Ion ecosystem. Changes may be requested and can be added to the proposal via new commits on the PR. When the Ion Schema **maintainers** deem the proposal is mature, a final comment period of at least two weeks will be announced, marking the beginning of phase two.

The comment period may be extended at the discretion of the **maintainers**—e.g. due to the complexity of the proposal, because the comment period would fall during a holiday, or because of ongoing, productive discussion about the proposal.

During the comment period, if the RFC is modified in response to feedback, any modifications should be appended to the PR as new commits, and the RFC document itself should include a change-log with summaries of the changes.
After this time has passed, the **maintainers** will either close the PR or merge it. Merging the PR signals that the **maintainers** intend to add it to the Ion Schema spec in an unscheduled, unspecified future version. These updates will also appear on the Ion home and news pages.

Note that in some circumstances, the RFC may need to be modified between the PR being merged and it being added to the spec in a new version. Such changes would typically be needed to address technical conflicts that were not identified during the initial RFC discussion. If necessary, the changes will be done in a later PR that does not follow the complete RFC process. The **maintainers** will attempt to include interested parties from the original RFC in the new PR and aim to minimize the changes being introduced.

## 3. An Ion Schema Version RFC will adopt the feature

*Ion Schema Version RFCs* are meta-RFCs that describe a new version of Ion Schema. They are PRs created by the **maintainers**, not by community members proposing a new feature. Version RFCs include a `.md` file that contains:

* A list of the feature RFCs to be included in the new version, including for each a brief summary and a link to the accepted RFC for that feature. Links to other documentation may also be included.
* The list of all accepted feature RFCs that are *not* included in the new version, with reasons why they are not included.
* If it is a new major version, a definition of the compatibility and import requirements between this version and the prior major version, as required by [Ion Schema Language Versions](https://quip-amazon.com/WxDyAMCsxccV).

For an example, please see [the Ion Schema 2.0 RFC](https://github.com/amazon-ion/ion-schema/blob/208165adb10c889949252e7ccd926862bfe60019/rfcs/ion_schema_2_0/ion_schema_2_0.md) ([PR](https://github.com/amazon-ion/ion-schema/pull/69)).

Ion Schema versions are not released on a fixed schedule. The creation of a version RFC is a required step on the path to release but is not an indication of any particular timeline.

Ion Schema version RFCs are not finalized until they are merged; feature RFCs may be moved between them or removed altogether. Removal does not revoke a previously accepted feature RFC; it only removes it from that version.

## 4. A new Ion Schema spec version will be released

When developer bandwidth is available, the next Ion Schema version RFC will be merged. At this point, **contributors** (in all likelihood, mostly just the **maintainers**) will write a new version of the Ion Schema specification that incorporates the changes in the Ion Schema Version RFC. Designing the exact format of the new specification document, including how individual features’ supported versions will be communicated, is outside of the scope of this document.

Once the new version of the spec has been merged (via one or more pull requests), Ion Schema libraries can be updated to add support for the features that were included in the new version.

As before, announcements will be added to the Ion home and news pages.

# Internal steps for considering a proposal

*This section is addressed to the Ion Schema ** **maintainers**.* *It is included here in order to be transparent about the approval process.*

## Requesting an RFC

When a community member creates a feature request in `ion-schema`, we (the Ion Schema **maintainers**) will engage with the requester on the GitHub issue. The **maintainers** will come to a consensus on the proposal; if its value proposition is compelling, we will request an RFC to explore the technical details of its implementation in depth. If the proposal does not add value or goes against the design principles of Ion Schema, we will politely decline. However, this does not preclude the **feature requestor** or any other **contributor** from revising and resubmitting their proposal with new ideas or information.

Either way, the Ion schema **maintainers** must respond with a justification for our decision. For a feature that is approved, a simple message about how the feature will be useful, aligns with the design goals, etc. will suffice. For a rejection, the justification should specifically explain why the idea does not add value to Ion Schema or how it goes against the design principles of Ion Schema.

If we are interested in an idea but **feature requestor** does not want to create an RFC, we may decide to take it up ourselves, but we are not required to do so.

## Approving an RFC

The Ion Schema **maintainers** are responsible for implementing and maintaining both the spec and most of its implementations, so we are the biggest stakeholder. The RFC cannot move ahead without the **maintainers**’ agreement.
We believe that it should be easy to iterate on Ion Schema, and so the most critical feedback that we can receive is whether something we are introducing is a misfeature or could otherwise cause problems later on. Feedback about the omission of desired features (or part of a feature) will also be considered, but we may decide to defer solving it if there are no backwards compatibility issues that the proposed feature would introduce.

After feedback has been gathered from Ion Schema users and subject-matter experts, the Ion Schema **maintainers** will incorporate the feedback and make the final decision on the RFC.

The outcome of this process will be shared on the `ion-schema` GitHub issue, resulting in the PR being merged or closed as appropriate.

## Creating an RFC for a new Ion Schema version

When we should create a new version depends on our subjective judgment of whether it is a good time for a new version. However, we should consider:

* Are we still in the midst of implementing the last Ion Schema version?
* How many accepted features are waiting to be released in a new version of the ISL spec?
* Has anyone specifically asked for a new version to be released?
* Do we have the bandwidth to implement the new version in Ion Schema libraries?
* Has a **contributor** outside the team of **maintainers** offered to help implement the new version?

We should be transparent if we do not have the bandwidth to implement a new version, but we should not stand in the way of someone who is willing to invest their own time in improving Ion Schema.

# FAQ

#### **Why is there no private comment period?**

Ion Schema is an open source project, so we are going to try to do our design work out in the open too. We want interested parties to be able to share their thoughts and have a say in the direction of Ion Schema. (See [opensource.guide – Keep Communication Public](https://opensource.guide/best-practices/#keep-communication-public).)

#### What if I have feedback that contains confidential information?

If you are employed by Amazon, refer to internal policies about sharing confidential information.

If you are not employed by Amazon, please do not share any confidential information on GitHub or directly with the **maintainers**. If you need additional time to rework your feedback so that it does not include confidential information, you may ask for the comment period to be extended.

Regardless of the source, the **maintainers** will attempt to publicly summarize all private feedback.

#### Can a feature RFC become “un-accepted”?

Yes. An RFC can be reverted by another RFC that explicitly revokes or supersedes a prior RFC. An RFC that reverts or supersedes a previous RFC is expected to go through the same process as any other RFC.
