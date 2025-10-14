# Contributing to Khaos

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- **Report Bugs**: Open an issue describing the bug
- **Suggest Features**: Share your ideas for new features
- **Submit Pull Requests**: Contribute code improvements
- **Improve Documentation**: Help make docs clearer
- **Write Tests**: Add test coverage
- **Review Code**: Provide feedback on pull requests

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Khaos.git
cd Khaos
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## 📝 Coding Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Prefer `const` over `let`, avoid `var`

```typescript
// Good
interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  return await invoke<User>('get_user', { id });
}

// Bad
async function getU(x: any) {
  return await invoke('get_user', { id: x });
}
```

### Rust

- Follow Rust naming conventions
- Use `rustfmt` for formatting
- Add documentation comments (`///`)
- Handle errors explicitly
- Keep functions focused and small

```rust
// Good
/// Fetches a user by their ID
///
/// # Arguments
/// * `id` - The user's unique identifier
///
/// # Returns
/// Result containing the user or an error message
#[tauri::command]
pub fn get_user(id: u32) -> Result<User, String> {
    // Implementation
}

// Bad
#[tauri::command]
pub fn getU(x: u32) -> User {
    // Implementation without error handling
}
```

### Svelte Components

- One component per file
- Use `<script lang="ts">` for TypeScript
- Export props with types
- Keep components focused and reusable
- Use DaisyUI classes over custom CSS

```svelte
<!-- Good -->
<script lang="ts">
  export let title: string;
  export let description: string = '';
  export let onClose: () => void;
</script>

<div class="card bg-base-200">
  <div class="card-body">
    <h2 class="card-title">{title}</h2>
    {#if description}
      <p>{description}</p>
    {/if}
    <button class="btn btn-primary" on:click={onClose}>
      Close
    </button>
  </div>
</div>
```

### CSS/Styling

- Prefer DaisyUI/Tailwind classes
- Use CSS modules for component-specific styles
- Follow mobile-first responsive design
- Ensure both themes look good

## 🧪 Testing

### Before Submitting

```bash
# Type checking
bun run check

# Build test
bun run build
bun run tauri:build

# Run the app
bun run tauri:dev
```

### Test Checklist

- [ ] App starts without errors
- [ ] Feature works as expected
- [ ] UI looks good in both themes
- [ ] No console errors or warnings
- [ ] Responsive design works
- [ ] Code is properly typed
- [ ] Documentation updated if needed

## 📦 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(theme): add auto-theme detection based on system

fix(commands): resolve memory leak in data fetching

docs(readme): update installation instructions

refactor(store): simplify theme store logic

chore(deps): update dependencies to latest versions
```

## 🔀 Pull Request Process

### 1. Update Your Branch

```bash
git fetch origin
git rebase origin/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Go to GitHub and create a PR
- Fill out the PR template
- Link related issues
- Request review

### 4. PR Review

- Address reviewer feedback
- Make requested changes
- Keep discussions professional and constructive

### PR Checklist

- [ ] Code follows project style
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts
- [ ] Commits are clean and meaningful
- [ ] PR description is clear

## 📚 Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Adding new dependencies
- Changing configuration

### Documentation Files

- **README.md**: Overview and basic usage
- **QUICKSTART.md**: Getting started quickly
- **DEVELOPMENT.md**: Development guidelines
- **DEPLOYMENT.md**: Build and deployment
- **CHANGELOG.md**: Version history

## 🐛 Reporting Bugs

### Bug Report Should Include

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: How to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, version, etc.
6. **Screenshots**: If applicable
7. **Logs**: Error messages or console output

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 11]
 - App Version: [e.g. 0.1.0]
 - Browser: [if frontend issue]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Should Include

1. **Problem**: What problem does it solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other approaches considered
4. **Context**: Additional information

## 🏗️ Architecture Decisions

For major changes:

1. **Open an Issue**: Discuss the change first
2. **Get Feedback**: Wait for maintainer feedback
3. **Create Design Doc**: For large features
4. **Prototype**: Create proof of concept
5. **Implement**: Build the feature
6. **Document**: Update relevant docs

## 🎨 Design Guidelines

### UI/UX Principles

- **Consistency**: Match existing design patterns
- **Simplicity**: Keep UI clean and intuitive
- **Accessibility**: Support keyboard navigation
- **Responsiveness**: Work on all screen sizes
- **Theme Support**: Test in both dark/light modes

### Color Usage

- Use DaisyUI semantic colors:
  - `primary`: Main actions
  - `secondary`: Secondary actions
  - `accent`: Highlights
  - `neutral`: Neutral elements
  - `success/warning/error/info`: Status messages

## 🔒 Security

### Reporting Security Issues

**Do not** open public issues for security vulnerabilities.

Instead:
1. Email security details privately
2. Include steps to reproduce
3. Describe potential impact
4. Suggest fixes if possible

### Security Best Practices

- Never commit secrets or API keys
- Validate all user inputs
- Use Tauri's security features
- Keep dependencies updated
- Follow principle of least privilege

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open an Issue
- **Chat**: [Your Discord/Slack if available]
- **Email**: [Your email if applicable]

## 🎓 Learning Resources

- [Tauri Documentation](https://tauri.app/)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Rust Book](https://doc.rust-lang.org/book/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [DaisyUI Components](https://daisyui.com/components/)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers
- Give and accept constructive feedback
- Focus on what's best for the project

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing private information

## ✅ Review Process

### What Reviewers Look For

- Code quality and style
- Test coverage
- Documentation completeness
- Performance implications
- Security considerations
- Breaking changes

### Review Timeline

- Small PRs: 1-3 days
- Medium PRs: 3-7 days
- Large PRs: 1-2 weeks

## 🎉 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- CHANGELOG.md

Thank you for contributing! 🙏

---

**Questions?** Feel free to ask in GitHub Discussions or open an issue!

